import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface DbResult {
  id: string;
  [key: string]: any;
}

// UUID formatını doğrulama fonksiyonu
const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Durum geçmişi kaydı oluşturan yardımcı fonksiyon
const createStatusHistoryEntry = async (
  client: any,
  ticketId: string,
  previousStatus: string | null,
  newStatus: string,
  changedBy: string | null,
  req: NextApiRequest
): Promise<void> => {
  try {
    // Eğer önceki durum değişikliği varsa, o durumda geçirilen süreyi hesapla
    let timeInStatus = null;
    if (previousStatus) {
      try {
        // Önceki durum değişikliğinin zamanını bul
        const previousStatusEntry = await client.query(`
          SELECT changed_at
          FROM ticket_status_history 
          WHERE ticket_id = $1 
          AND new_status = $2 
          ORDER BY changed_at DESC 
          LIMIT 1
        `, [ticketId, previousStatus]);

        if (previousStatusEntry.rows.length > 0) {
          const previousChangeTime = new Date(previousStatusEntry.rows[0].changed_at);
          const currentTime = new Date();
          
          // Saniye cinsinden süreyi hesapla
          timeInStatus = Math.floor((currentTime.getTime() - previousChangeTime.getTime()) / 1000);
        }
      } catch (timeError) {
        console.error("Durum süresi hesaplanırken hata:", timeError);
        // Süre hesaplama hatası kayıt oluşturmayı engellemeyecek
      }
    }

    // Sistem kullanıcısı ID'si - changedBy null ise bu ID kullanılacak
    const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";

    // Durum değişikliği kaydını oluştur
    await client.query(`
      INSERT INTO ticket_status_history 
      (ticket_id, previous_status, new_status, changed_by, time_in_status) 
      VALUES ($1, $2, $3, $4, $5)
    `, [
      ticketId,
      previousStatus,
      newStatus,
      changedBy || systemUserId, // Eğer changedBy null ise sistem kullanıcısı ID'sini kullan
      timeInStatus
    ]);

  } catch (error) {
    console.error("Durum geçmişi kaydı oluşturulurken hata:", error);
    // Hata durumunda işlemi engellememek için hatayı yutuyoruz
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, tags, ...ticketData } = req.body;
    const tenantId = extractTenantFromBody(req);
    
    // UUID alanlarını doğrula
    const safeTicketData = {
      ...ticketData,
      categoryId: isValidUUID(ticketData.categoryId) ? ticketData.categoryId : null,
      subcategoryId: isValidUUID(ticketData.subcategoryId) ? ticketData.subcategoryId : null,
      groupId: isValidUUID(ticketData.groupId) ? ticketData.groupId : null,
      assignedTo: isValidUUID(ticketData.assignedTo) ? ticketData.assignedTo : null,
      parent_company_id: isValidUUID(ticketData.parent_company_id) ? ticketData.parent_company_id : null,
      contact_id: isValidUUID(ticketData.contact_id) ? ticketData.contact_id : null,
      // Status değerini doğrula
      status: ['open', 'in_progress', 'waiting', 'pending', 'resolved', 'closed'].includes(ticketData.status) ? ticketData.status : 'open'
    };

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      let ticketId: string;
      let ticketNo: string;

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

        // Durum geçmişi kaydı oluştur
        const previousStatusQuery = `
          SELECT status
          FROM tickets
          WHERE id = $1
        `;
        const previousStatusResult = await client.query(previousStatusQuery, [ticketId]);
        const previousStatus = previousStatusResult.rows[0].status;
        
        // Sistem kullanıcısı ID'si
        const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";
        
        await createStatusHistoryEntry(
          client, 
          ticketId, 
          previousStatus, 
          safeTicketData.status, 
          safeTicketData.updatedBy || systemUserId, 
          req
        );
      } else {
        // Kişi işleme mantığı - contact_id kontrolü ve oluşturma
        let contactId: string | null = safeTicketData.contact_id;
      
        // Telefon numarası veya email varsa, contacts tablosunda kontrol et
        if (safeTicketData.customer_phone || safeTicketData.customer_email) {
          try {
            // Önce telefon numarası veya email ile kişiyi ara
            const checkContactQuery = `
              SELECT id FROM contacts 
              WHERE (mobile = $1 OR email = $2)
              AND (is_deleted = false OR is_deleted IS NULL)
            `;
            
            const contactResult = await client.query(checkContactQuery, [
              safeTicketData.customer_phone || '',
              safeTicketData.customer_email || ''
            ]);
            
            if (contactResult.rows.length > 0) {
              // Kişi bulundu, ID'sini al ve güncelle
              contactId = contactResult.rows[0].id;
              
              // Kişiyi güncelle
              const updateContactQuery = `
                UPDATE contacts
                SET 
                  first_name = CASE WHEN $1 != '' THEN SPLIT_PART($1, ' ', 1) ELSE first_name END,
                  last_name = CASE WHEN $1 != '' THEN SPLIT_PART($1, ' ', 2) ELSE last_name END,
                  email = COALESCE($2, email),
                  position = COALESCE($3, position),
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, first_name, last_name, email
              `;
              
              const updateResult = await client.query(updateContactQuery, [
                safeTicketData.customer_name || '',
                safeTicketData.customer_email,
                safeTicketData.contact_position,
                contactId
              ]);
            } else if (safeTicketData.customer_name) {
              // Kişi bulunamadı ve isim veya email varsa yeni kişi oluştur
              const createContactQuery = `
                INSERT INTO contacts (
                  first_name,
                  last_name,
                  email,
                  mobile,
                  position,
                  created_at,
                  updated_at,
                  is_deleted
                )
                VALUES (
                  SPLIT_PART($1, ' ', 1),
                  SPLIT_PART($1, ' ', 2),
                  $2,
                  $3,
                  $4,
                  CURRENT_TIMESTAMP,
                  CURRENT_TIMESTAMP,
                  false
                )
                RETURNING id, first_name, last_name, email
              `;
              const newContactResult = await client.query(createContactQuery, [
                safeTicketData.customer_name || '',
                safeTicketData.customer_email,
                safeTicketData.customer_phone,
                safeTicketData.contact_position
              ]);
              
              if (newContactResult.rows.length > 0) {
                contactId = newContactResult.rows[0].id;
                safeTicketData.contact_id = contactId; // Yeni oluşturulan kişi ID'sini ticket'a ata
              }
            }
          } catch (contactError) {
            console.error('Error in contact processing:', contactError);
            // Hata olsa bile işleme devam et, sadece contact_id null olacak
          }
        }

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
            contactId,
            safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
            safeTicketData.createdBy
          ]);

          if (result.rows.length === 0) {
            return res.status(500).json({ success: false, message: 'Error creating ticket' });
          }

          ticketId = result.rows[0].id;
          ticketNo = result.rows[0].ticketno;

          // Sistem kullanıcısı ID'si
          const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";

          // Durum geçmişi kaydı oluştur
          await createStatusHistoryEntry(
            client, 
            ticketId, 
            null, 
            safeTicketData.status, 
            safeTicketData.createdBy || systemUserId, 
            req
          );
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
