import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';
import { sendEventToClients } from '../../events';


// UUID formatını doğrulama fonksiyonu
const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, tags, ...ticketData } = req.body;
    
    // UUID alanlarını doğrula
    const safeTicketData = {
      ...ticketData,
      categoryId: isValidUUID(ticketData.categoryId) ? ticketData.categoryId : null,
      subcategoryId: isValidUUID(ticketData.subcategoryId) ? ticketData.subcategoryId : null,
      groupId: isValidUUID(ticketData.groupId) ? ticketData.groupId : null,
      assignedTo: isValidUUID(ticketData.assignedTo) ? ticketData.assignedTo : null,
      parent_company_id: isValidUUID(ticketData.parent_company_id) ? ticketData.parent_company_id : null,
      contact_id: isValidUUID(ticketData.contact_id) ? ticketData.contact_id : null
    };

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Eğer bu yeni bir ticket ise ve telefon numarası veya e-posta varsa kontrol et
      if (!id && (safeTicketData.customer_phone || safeTicketData.customer_email)) {
        const phoneNumber = safeTicketData.customer_phone || null;
        const email = safeTicketData.customer_email || null;
        
        // Son 2 saat içinde bu telefon numarası veya e-posta ile oluşturulmuş bir ticket var mı kontrol et
        const checkExistingTicketQuery = `
        SELECT id, title, description, ticketno
          FROM tickets 
          WHERE 
            (
              (customer_phone = $1 AND $1 IS NOT NULL)
              OR
              (customer_email = $2 AND $2 IS NOT NULL AND $1 IS NULL)
            )
            AND created_at > NOW() - INTERVAL '2 hours'
            AND status NOT IN ('resolved', 'closed')
            AND (is_deleted = false OR is_deleted IS NULL)
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const existingTicket = await client.query(checkExistingTicketQuery, [
          phoneNumber,
          email
        ]);
        
        // Eğer son 2 saat içinde oluşturulmuş bir ticket varsa, yeni bir yorum ekle
        if (existingTicket.rows.length > 0) {
          const existingTicketId = existingTicket.rows[0].id;
          
          // Yeni yorum ekle
          const insertCommentQuery = `
            INSERT INTO ticket_comments (
              ticket_id,
              content,
              is_internal,
              created_at,
              created_by,
              updated_at,
              is_deleted
            )
            VALUES (
              $1, $2, false, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, false
            )
            RETURNING id, created_at as "createdAt";
          `;
          
          const commentContent = `Yeni ticket isteği:\n\nBaşlık: ${safeTicketData.title}\n\nAçıklama: ${safeTicketData.description || 'Açıklama yok'}`;
          
          // Sistem otomatik olarak yorum eklediği için sabit ID kullan
          const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";
          
          const commentResult = await client.query(insertCommentQuery, [
            existingTicketId,
            commentContent,
            systemUserId
          ]);
          
          // Ticket'in updated_at alanını ve callcount'u güncelle
          await client.query(
            'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP, callcount = COALESCE(callcount, 0) + 1 WHERE id = $1',
            [existingTicketId]
          );
          
          // Güncellenmiş ticket verilerini al
          const updatedTicketQuery = `
            SELECT * FROM tickets WHERE id = $1
          `;
          const updatedTicketResult = await client.query(updatedTicketQuery, [existingTicketId]);
          const updatedTicket = updatedTicketResult.rows[0];
          
          // SSE kullanarak callcount güncellemesi bildirimini gönder
          try {
            sendEventToClients('ticket-update', {
              action: 'update',
              updateType: 'callcount',
              ticket: {
                ...updatedTicket,
                id: existingTicketId,
                ticketno: updatedTicket.ticketno || existingTicketId.substring(0, 8),
                // Hem snake_case hem de camelCase formatında gönder
                customerName: updatedTicket.customer_name,
                customerEmail: updatedTicket.customer_email,
                customerPhone: updatedTicket.customer_phone,
                contactPosition: updatedTicket.contact_position,
                companyName: updatedTicket.company_name,
                companyId: updatedTicket.company_id,
                contactId: updatedTicket.contact_id,
                categoryId: updatedTicket.category_id,
                subcategoryId: updatedTicket.subcategory_id,
                groupId: updatedTicket.group_id,
                assignedTo: updatedTicket.assigned_to,
                createdAt: updatedTicket.created_at,
                updatedAt: updatedTicket.updated_at,
                dueDate: updatedTicket.due_date,
                slaBreach: updatedTicket.sla_breach
              }
            });
          } catch (sseError) {
            console.error('SSE callcount güncelleme olayı gönderme hatası:', sseError);
          }
          
          // Var olan ticket'a yorum eklendiğini bildir
          return res.status(200).json({
            success: true,
            message: 'Existing ticket found with the same phone number or email. Comment added instead of creating a new ticket.',
            id: existingTicketId,
            ticketno: existingTicket.rows[0].ticketno || existingTicketId.substring(0, 8),
            isCommentAdded: true
          });
        }
      }
      
      // Mevcut telefon numarasına sahip ticket bulunamadıysa, normal işleme devam et
      let ticketId: string;
      let ticketNo: string;
      let isNewTicket = false;

      if (id) {
        // Update existing ticket
        const updateQuery = `
          UPDATE tickets
          SET 
            title = $1,
            description = $2,
            status = $3,
            priority = $4,
            source = $5,
            category_id = $6,
            subcategory_id = $7,
            group_id = $8,
            assigned_to = $9,
            customer_name = $10,
            customer_email = $11,
            customer_phone = $12,
            company_name = $13,
            company_id = $14,
            contact_position = $15,
            due_date = $16,
            resolution_time = $17,
            parent_company_id = $18,
            contact_id = $19,
            sla_breach = $20,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $21
          WHERE id = $22
          RETURNING id, ticketno;
        `;

        const result = await client.query(updateQuery, [
          safeTicketData.title,
          safeTicketData.description,
          safeTicketData.status,
          safeTicketData.priority,
          safeTicketData.source,
          safeTicketData.categoryId,
          safeTicketData.subcategoryId,
          safeTicketData.groupId,
          safeTicketData.assignedTo,
          safeTicketData.customer_name,
          safeTicketData.customer_email,
          safeTicketData.customer_phone,
          safeTicketData.company_name,
          safeTicketData.company_id,
          safeTicketData.contact_position,
          safeTicketData.due_date,
          safeTicketData.resolution_time,
          safeTicketData.parent_company_id,
          safeTicketData.contact_id,
          safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
          safeTicketData.updatedBy,
          id
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticketId = result.rows[0].id;
        ticketNo = result.rows[0].ticketno;
      } else {
        // Check for duplicate tickets with the same title and company_id
        const checkDuplicateQuery = `
          SELECT id FROM tickets 
          WHERE title = $1 
          AND company_id = $2
          AND (is_deleted = false OR is_deleted IS NULL)
        `;
        
        const duplicateResult = await client.query(checkDuplicateQuery, [
          safeTicketData.title,
          safeTicketData.company_id
        ]);
        
        if (duplicateResult.rows.length > 0) {
          return res.status(409).json({ 
            success: false, 
            message: 'A ticket with the same title already exists for this company' 
          });
        }
        
        // Create new ticket
        const insertQuery = `
          INSERT INTO tickets (
            title,
            description,
            status,
            priority,
            source,
            category_id,
            subcategory_id,
            group_id,
            assigned_to,
            customer_name,
            customer_email,
            customer_phone,
            company_name,
            company_id,
            contact_position,
            due_date,
            resolution_time,
            parent_company_id,
            contact_id,
            sla_breach,
            created_at,
            created_by,
            updated_at,
            is_deleted
          ) 
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            CURRENT_TIMESTAMP, $21, CURRENT_TIMESTAMP, false
          )
          RETURNING id, ticketno;
        `;

        try {
          // Artık telefon numarası direk customer_phone alanından alınıyor
          
          const result = await client.query(insertQuery, [
            safeTicketData.title,
            safeTicketData.description,
            safeTicketData.status,
            safeTicketData.priority,
            safeTicketData.source,
            safeTicketData.categoryId,
            safeTicketData.subcategoryId,
            safeTicketData.groupId,
            safeTicketData.assignedTo,
            safeTicketData.customer_name,
            safeTicketData.customer_email,
            safeTicketData.customer_phone,
            safeTicketData.company_name,
            safeTicketData.company_id,
            safeTicketData.contact_position,
            safeTicketData.due_date,
            safeTicketData.resolution_time,
            safeTicketData.parent_company_id,
            safeTicketData.contact_id,
            safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
            safeTicketData.createdBy
          ]);

          if (result.rows.length === 0) {
            return res.status(500).json({ success: false, message: 'Error creating ticket' });
          }

          ticketId = result.rows[0].id;
          ticketNo = result.rows[0].ticketno;
          isNewTicket = true;
        } catch (queryError: any) {
          console.error('SQL query error:', queryError);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error while creating ticket', 
            details: queryError.message 
          });
        }
      }

      // Handle tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // First, remove existing tag associations if updating
        if (id) {
          await client.query(
            'UPDATE ticket_tags SET is_deleted = true WHERE ticket_id = $1',
            [ticketId]
          );
        }

        // Then add new tag associations
        for (const tagName of tags) {
          // Check if tag exists, if not create it
          const tagQuery = `
            SELECT id FROM tags WHERE name = $1 AND is_deleted = false
          `;
          const tagResult = await client.query(tagQuery, [tagName]);
          
          let tagId: string;
          
          if (tagResult.rows.length === 0) {
            // Create new tag
            const createTagQuery = `
              INSERT INTO tags (name, created_at, updated_at, is_deleted)
              VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
              RETURNING id
            `;
            const newTagResult = await client.query(createTagQuery, [tagName]);
            tagId = newTagResult.rows[0].id;
          } else {
            tagId = tagResult.rows[0].id;
          }
          
          // Create ticket-tag association
          const ticketTagQuery = `
            INSERT INTO ticket_tags (
              ticket_id, tag_id, created_at, updated_at, is_deleted
            )
            VALUES (
              $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false
            )
            ON CONFLICT (ticket_id, tag_id) 
            DO UPDATE SET is_deleted = false, updated_at = CURRENT_TIMESTAMP
          `;
          
          await client.query(ticketTagQuery, [ticketId, tagId]);
        }
      }

      // Ticket'ı tam olarak almak için
      const getTicketQuery = `
        SELECT * FROM tickets WHERE id = $1
      `;
      const ticketResult = await client.query(getTicketQuery, [ticketId]);
      const ticket = ticketResult.rows[0];
      // SSE kullanarak bildirim gönder
      try {
        // Tüm istemcilere bildirim gönder
        sendEventToClients('ticket-update', {
          action: isNewTicket ? 'create' : 'update',
          ticket: {
            ...ticket,
            id: ticketId,
            ticketno: ticket.ticketno || ticketId.substring(0, 8),
            // Hem snake_case hem de camelCase formatında gönder
            customerName: ticket.customer_name,
            customerEmail: ticket.customer_email,
            customerPhone: ticket.customer_phone,
            contactPosition: ticket.contact_position,
            companyName: ticket.company_name,
            companyId: ticket.company_id,
            contactId: ticket.contact_id,
            categoryId: ticket.category_id,
            subcategoryId: ticket.subcategory_id,
            groupId: ticket.group_id,
            assignedTo: ticket.assigned_to,
            createdAt: ticket.created_at,
            updatedAt: ticket.updated_at,
            dueDate: ticket.due_date,
            slaBreach: ticket.sla_breach
          }
        });
      } catch (sseError) {
        console.error('SSE olayı gönderme hatası:', sseError);
      }

      return res.status(id ? 200 : 201).json({ 
        success: true, 
        message: id ? 'Ticket updated successfully' : 'Ticket created successfully', 
        id: ticketId,
        ticketno: ticketNo 
      });
    });
  } catch (error: any) {
    console.error('Create/Update ticket API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: error.message 
    });
  }
}