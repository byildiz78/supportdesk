import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';
import { sendEventToClients } from '../../events';
import { generateTicketCreationNotification, sendTicketNotificationEmail } from '@/utils/email-utils';

// Define interface for comment response
interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  created_by: string;
  created_by_name: string | null;
  email_id?: string;
  thread_id?: string;
  sender?: string;
  sender_email?: string;
  to_recipients?: string[] | null;
  cc_recipients?: string[] | null;
  html_content?: string;
  attachments?: any[];
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
  changedBy: string,
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

    // Durum değişikliği kaydını oluştur
    await client.query(`
      INSERT INTO ticket_status_history 
      (ticket_id, previous_status, new_status, changed_by, time_in_status) 
      VALUES ($1, $2, $3, $4, $5)
    `, [
      ticketId,
      previousStatus,
      newStatus,
      changedBy,
      timeInStatus
    ]);

    console.log(`Durum geçmişi kaydı oluşturuldu: ${ticketId}, ${previousStatus} -> ${newStatus}`);
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
    const { 
      id, 
      tags, 
      email_id, 
      thread_id, 
      sender, 
      sender_email, 
      to_recipients, 
      cc_recipients, 
      html_content, 
      attachments,
      in_reply_to_email_id,
      is_internal,
      created_by,
      ...ticketData 
    } = req.body;
    
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

    // Ensure arrays and JSON are properly formatted
    // to_recipients and cc_recipients are text[] in the database
    const safeToRecipients = to_recipients && Array.isArray(to_recipients) ? to_recipients : null;
    const safeCcRecipients = cc_recipients && Array.isArray(cc_recipients) ? cc_recipients : null;
    // attachments is jsonb in the database
    const safeAttachments = attachments ? JSON.stringify(attachments) : null;

    // Add variable to store the created comment for replies
    let responseComment: TicketComment | null = null;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Eğer bu yeni bir ticket ise ve email_id veya thread_id varsa kontrol et
      if (!id && (email_id || thread_id)) {
        // Önce email_id ile eşleşen bir yorum var mı kontrol et
        const checkExistingCommentQuery = `
          SELECT tc.ticket_id, t.title, t.description, t.ticketno
          FROM ticket_comments tc
          JOIN tickets t ON tc.ticket_id = t.id
          WHERE 
            (
              (tc.email_id = $1 AND $1 IS NOT NULL)
              OR
              (tc.thread_id = $2 AND $2 IS NOT NULL AND $1 IS NULL)
            )
            AND t.status NOT IN ('resolved', 'closed')
            AND (t.is_deleted = false OR t.is_deleted IS NULL)
          ORDER BY tc.created_at DESC
          LIMIT 1
        `;
        
        const existingComment = await client.query(checkExistingCommentQuery, [
          email_id,
          thread_id
        ]);
        
        // Eğer email_id veya thread_id ile eşleşen bir yorum varsa, ilgili ticket'a yeni bir yorum ekle
        if (existingComment.rows.length > 0) {
          const existingTicketId = existingComment.rows[0].ticket_id;
          
          // İçerik olarak title (e-posta konusu) kullan
          const commentContent = ticketData.title || 'İçerik yok';
          
          // Ticket numarasını subject'e ekle
          const ticketNo = existingComment.rows[0].ticketno;
          let subjectWithTicketNo = commentContent;
          
          // Ticket numarası varsa ve subject içinde yoksa ekle
          if (ticketNo && !subjectWithTicketNo.includes(`#${ticketNo}#`)) {
            subjectWithTicketNo = `${subjectWithTicketNo} #${ticketNo}#`;
            console.log('Ticket numarası eklendi, yeni subject:', subjectWithTicketNo);
          }
          
          // Sistem otomatik olarak yorum eklediği için sabit ID kullan
          const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";
          
          const insertCommentQuery = `
            INSERT INTO ticket_comments (
              ticket_id,
              content,
              is_internal,
              created_at,
              created_by,
              updated_at,
              is_deleted,
              email_id,
              thread_id,
              sender,
              sender_email,
              to_recipients,
              cc_recipients,
              html_content,
              attachments
            )
            VALUES (
              $1, $2, false, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, false,
              $4, $5, $6, $7, $8, $9, $10, $11::jsonb
            )
            RETURNING id, created_at as "createdAt";
          `;
          
          const commentResult = await client.query(insertCommentQuery, [
            existingTicketId,
            subjectWithTicketNo, // Ticket numarası eklenmiş subject
            systemUserId,
            email_id,
            thread_id,
            sender,
            sender_email,
            safeToRecipients,
            safeCcRecipients,
            html_content,
            safeAttachments
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
            message: 'Existing ticket found with the same email_id or thread_id. Comment added instead of creating a new ticket.',
            id: existingTicketId,
            ticketno: existingComment.rows[0].ticketno || existingTicketId.substring(0, 8),
            isCommentAdded: true
          });
        }
      }
      
      // Mevcut email_id veya thread_id ile eşleşen bir yorum bulunamadıysa, normal işleme devam et
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
          RETURNING id, ticketno, status, (
            SELECT status FROM tickets WHERE id = $22
          ) as previous_status;
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
          safeTicketData.customer_name || sender,
          safeTicketData.customer_email || sender_email,
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
        
        // Durum değişikliği varsa, durum geçmişi kaydı oluştur
        const previousStatus = result.rows[0].previous_status;
        const newStatus = safeTicketData.status;
        
        if (previousStatus !== newStatus) {
          await createStatusHistoryEntry(
            client,
            ticketId,
            previousStatus,
            newStatus,
            safeTicketData.updatedBy || "efa579e5-6d64-43d0-b12a-a078ab357e90", // Sistem kullanıcısı ID'si
            req
          );
        }
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
          // Email source ise, sender ve sender_email bilgilerini kullan
          const customerName = safeTicketData.source === 'email' ? sender || safeTicketData.customer_name : safeTicketData.customer_name;
          const customerEmail = safeTicketData.source === 'email' ? sender_email || safeTicketData.customer_email : safeTicketData.customer_email;
          
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
            customerName,
            customerEmail,
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
          
          // Yeni oluşturulan bilet için durum geçmişi kaydı oluştur
          await createStatusHistoryEntry(
            client,
            ticketId,
            null, // Yeni bilet olduğu için önceki durum null
            safeTicketData.status,
            safeTicketData.createdBy || "efa579e5-6d64-43d0-b12a-a078ab357e90", // Sistem kullanıcısı ID'si
            req
          );
          
          // Eğer email ile ilgili bilgiler varsa, yeni oluşturulan ticket'a bir yorum ekle
          if (email_id || thread_id || html_content) {
            const insertCommentQuery = `
              INSERT INTO ticket_comments (
                ticket_id,
                content,
                is_internal,
                created_at,
                created_by,
                updated_at,
                is_deleted,
                email_id,
                thread_id,
                sender,
                sender_email,
                to_recipients,
                cc_recipients,
                html_content,
                attachments
              )
              VALUES (
                $1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, false,
                $5, $6, $7, $8, $9, $10, $11, $12::jsonb
              )
              RETURNING id, created_at as "createdAt";
            `;
            
            // İçerik olarak title (e-posta konusu) kullan
            const commentContent = ticketData.title || 'İçerik yok';
            
            // Ticket numarasını subject'e ekle
            let subjectWithTicketNo = commentContent;
            
            // Ticket numarası varsa ve subject içinde yoksa ekle
            if (ticketNo && !subjectWithTicketNo.includes(`#${ticketNo}#`)) {
              subjectWithTicketNo = `${subjectWithTicketNo} #${ticketNo}#`;
              console.log('Ticket numarası eklendi, yeni subject:', subjectWithTicketNo);
            }
            
            // Use provided created_by or system user ID
            const commentCreatedBy = created_by || "efa579e5-6d64-43d0-b12a-a078ab357e90";
            
            // Use provided is_internal or default to false
            const commentIsInternal = is_internal !== undefined ? is_internal : false;
            
            const commentResult = await client.query(insertCommentQuery, [
              ticketId,
              subjectWithTicketNo, // Ticket numarası eklenmiş subject
              commentIsInternal,
              commentCreatedBy,
              email_id,
              thread_id,
              sender,
              sender_email,
              safeToRecipients,
              safeCcRecipients,
              html_content,
              safeAttachments
            ]);
            
            // Get the created comment ID
            const commentId = commentResult.rows[0]?.id;
            const commentCreatedAt = commentResult.rows[0]?.createdAt;
            
            // If this is a reply, we'll return the comment in the response
            if (commentId) {
              // Get user name for the response
              const userQuery = `
                SELECT name FROM users WHERE id = $1 AND is_deleted = false
              `;
              
              const userResult = await client.query(userQuery, [commentCreatedBy]);
              const createdByName = userResult.rows.length > 0 ? userResult.rows[0].name : null;
              
              // Prepare the comment object to return
              const comment: TicketComment = {
                id: commentId,
                ticket_id: ticketId,
                content: subjectWithTicketNo,
                is_internal: commentIsInternal,
                created_at: commentCreatedAt,
                created_by: commentCreatedBy,
                created_by_name: createdByName,
                email_id,
                thread_id,
                sender,
                sender_email,
                to_recipients: safeToRecipients,
                cc_recipients: safeCcRecipients,
                html_content,
                attachments: attachments || []
              };
              
              // We'll add this to the response later
              responseComment = comment;
            }
          }
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

      // Send email notification for new ticket creation
      if (isNewTicket && safeTicketData.source === 'email' && sender_email) {
        console.log('Starting email notification process for new ticket:', {
          ticketId,
          ticketNo,
          sender_email,
          cc_recipients: safeCcRecipients,
          source: safeTicketData.source
        });
        
        try {
          // Prepare recipients
          const toRecipients = [sender_email];
          console.log('Email notification recipients:', {
            to: toRecipients,
            cc: safeCcRecipients
          });
          
          // Create email subject with ticket number
          let emailSubject = safeTicketData.title || 'Destek Talebiniz Alındı';
          if (ticketNo && !emailSubject.includes(`#${ticketNo}#`)) {
            emailSubject = `${emailSubject} #${ticketNo}#`;
          }
          console.log('Email notification subject:', emailSubject);
          
          // Get original email content from the comment
          const originalEmailContent = html_content || ticketData.content;
          console.log('Original email content available:', !!originalEmailContent);
          
          // Generate notification with original content
          const customerName = safeTicketData.customer_name || sender || 'Müşterimiz';
          console.log('Using customer name for notification:', customerName);
          const htmlContent = generateTicketCreationNotification(
            ticketNo, 
            customerName,
            originalEmailContent
          );
          console.log('Generated HTML notification content length:', htmlContent.length);
          
          // Send notification email asynchronously
          console.log('Sending notification email...');
          sendTicketNotificationEmail(
            emailSubject,
            toRecipients,
            safeCcRecipients,
            htmlContent
          ).then(emailResult => {
            console.log('Ticket notification email complete result:', JSON.stringify(emailResult));
            
            // Save notification as internal comment if email was sent
            if (emailResult.success) {
              console.log('Email sent successfully, saving as internal comment');
              // System user ID for automatic comments
              const systemUserId = "efa579e5-6d64-43d0-b12a-a078ab357e90";
              
              // Add notification as internal comment
              const insertNotificationCommentQuery = `
                INSERT INTO ticket_comments (
                  ticket_id,
                  content,
                  is_internal,
                  created_at,
                  created_by,
                  updated_at,
                  is_deleted,
                  html_content
                )
                VALUES (
                  $1, $2, true, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, false, $4
                )
              `;
              
              console.log('Saving notification as internal comment for ticket:', ticketId);
              db.executeQuery({
                query: insertNotificationCommentQuery,
                params: [
                  ticketId,
                  'Otomatik bildirim e-postası gönderildi',
                  systemUserId,
                  htmlContent
                ],
                req
              }).then(commentResult => {
                console.log('Notification comment saved successfully:', commentResult);
              }).catch(commentError => {
                console.error('Failed to save notification comment:', commentError);
              });
            } else {
              console.error('Email sending failed, not saving comment:', emailResult.message);
            }
          }).catch(emailError => {
            console.error('Failed to send notification email:', emailError);
            // Continue with response even if email fails
          });
        } catch (notificationError) {
          console.error('Error preparing notification email:', notificationError);
          // Continue with response even if notification preparation fails
        }
      } else {
        console.log('Skipping email notification - conditions not met:', {
          isNewTicket,
          source: safeTicketData.source,
          hasSenderEmail: !!sender_email
        });
      }

      return res.status(id ? 200 : 201).json({ 
        success: true, 
        message: id ? 'Ticket updated successfully' : 'Ticket created successfully', 
        id: ticketId,
        ticketno: ticketNo,
        comment: responseComment // Include the created comment in the response if this is a reply
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