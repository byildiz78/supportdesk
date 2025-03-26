import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Ticket {
  id: string;
  ticketno: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  source: string | null;
  category_id: string | null;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  group_id: string | null;
  group_name: string | null;
  assigned_to: string | null;
  assigned_user_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  company_name: string | null;
  company_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_position: string | null;
  due_date: string | null;
  resolution_time: number | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  parent_company_id: string | null;
  sla_breach: boolean | null;
}

interface Comment {
  id: string;
  ticket_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  created_by: string;
  created_by_name: string;
  updated_at: string | null;
  updated_by: string | null;
  email_id: string | null;
  thread_id: string | null;
  sender: string | null;
  sender_email: string | null;
  to_recipients: string[] | null;
  cc_recipients: string[] | null;
  html_content: string | null;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ticketId } = req.query;
    

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Ana bilet bilgilerini getir
    const ticketQuery = `
        SELECT 
        t.id,
        t.ticketno,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.source,
        t.category_id,
        c.name as category_name,
        t.subcategory_id,
        s.name as subcategory_name,
        t.group_id,
        g.name as group_name,
        t.customer_name,
        t.customer_email,
        t.customer_phone,
        t.company_id,
        t.company_name,
        t.contact_id,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        CONCAT(ct.first_name, ' ', ct.last_name) as contact_name,
        ct.email as contact_email,
        ct.phone as contact_phone,
        ct.position as contact_position,
        t.assigned_to,
        u.name as assigned_user_name,
        t.due_date,
        t.resolution_time,
        t.created_at,
        t.created_by,
        t.updated_at,
        t.updated_by,
        t.is_deleted,
        t.parent_company_id,
        t.sla_breach,
        t.resolution_time,
        t.resolution_notes
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON s.id = t.subcategory_id
      LEFT JOIN groups g ON g.id = t.group_id
      LEFT JOIN contacts ct ON t.contact_id = ct.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1::uuid
    `;

    try {
      const ticketResult = await db.executeQuery<Ticket[]>({
        query: ticketQuery,
        params: [ticketId],
        req
      });


      if (!ticketResult || ticketResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bilet bulunamadı'
        });
      }

      // Kişi bilgileri eksikse, contacts tablosundan tekrar sorgulayalım
      if (ticketResult[0].contact_id && (!ticketResult[0].contact_name || !ticketResult[0].contact_email || !ticketResult[0].contact_phone)) {
        
        const contactQuery = `
          SELECT 
            id,
            CONCAT(first_name, ' ', last_name) as contact_name,
            email as contact_email,
            phone as contact_phone,
            position as contact_position
          FROM contacts
          WHERE id = $1::uuid
        `;
        
        try {
          const contactResult = await db.executeQuery<any[]>({
            query: contactQuery,
            params: [ticketResult[0].contact_id],
            req
          });
          
          if (contactResult && contactResult.length > 0) {
            ticketResult[0].contact_name = contactResult[0].contact_name;
            ticketResult[0].contact_email = contactResult[0].contact_email;
            ticketResult[0].contact_phone = contactResult[0].contact_phone;
            ticketResult[0].contact_position = contactResult[0].contact_position;
          }
        } catch (contactError) {
          console.error('Kişi sorgusu hatası:', contactError);
        }
      }

      // Fetch comments for the ticket
      const commentsQuery = `
        SELECT 
          tc.id,
          tc.ticket_id,
          tc.content,
          tc.is_internal,
          tc.created_at,
          tc.created_by,
          u.name as created_by_name,
          tc.email_id,
          tc.thread_id,
          tc.sender,
          tc.sender_email,
          tc.to_recipients,
          tc.cc_recipients,
          tc.html_content,
          tc.attachments
        FROM ticket_comments tc
        LEFT JOIN users u ON tc.created_by = u.id
        WHERE tc.ticket_id = $1::uuid AND tc.is_deleted = false
        ORDER BY tc.created_at DESC
      `;

      try {
        const commentsResult = await db.executeQuery<Comment[]>({
          query: commentsQuery,
          params: [ticketId],
          req
        });

        // Yorumları JSON attachments ile birlikte işle
        const commentsWithAttachments = commentsResult.map(comment => {
          // JSON attachments alanını parse et
          let parsedAttachments = [];
          if (comment.attachments) {
            try {
              // Eğer zaten bir object ise (PostgreSQL driver tarafından otomatik parse edilmiş olabilir)
              if (typeof comment.attachments === 'object') {
                parsedAttachments = Array.isArray(comment.attachments) 
                  ? comment.attachments 
                  : [comment.attachments];
              } else if (typeof comment.attachments === 'string') {
                // String ise JSON olarak parse et
                parsedAttachments = JSON.parse(comment.attachments);
              }
            } catch (e) {
              console.error('Attachments JSON parse hatası:', e);
            }
          }

          return {
            ...comment,
            attachments: parsedAttachments || [],
            // Transform field names to match front-end expectations
            createdByName: comment.created_by_name,
            isInternal: comment.is_internal,
            createdAt: comment.created_at,
            createdBy: comment.created_by,
            emailId: comment.email_id,
            threadId: comment.thread_id,
            senderEmail: comment.sender_email,
            toRecipients: comment.to_recipients,
            ccRecipients: comment.cc_recipients,
            htmlContent: comment.html_content
          };
        });

        // Fetch all attachments for the ticket
        const ticketAttachmentsQuery = `
          SELECT 
            id,
            name,
            original_filename as "originalFilename",
            size,
            mime_type as "mimeType",
            public_url as "url",
            created_at as "uploadedAt",
            created_by as "uploadedBy"
          FROM attachments
          WHERE entity_type = 'ticket' AND entity_id = $1::uuid AND is_deleted = false
          ORDER BY created_at DESC
        `;

        const ticketAttachments = await db.executeQuery<Attachment[]>({
          query: ticketAttachmentsQuery,
          params: [ticketId],
          req
        });

        // Sonuçları birleştir
        const ticket = {
          ...ticketResult[0],
          comments: commentsWithAttachments || [],
          attachments: ticketAttachments || []
        };
        
        return res.status(200).json({
          success: true,
          data: ticket
        });
      } catch (commentError: any) {
        console.error('Yorum sorgusu hatası:', commentError);
        // Yorumlar alınamazsa bile bilet bilgilerini dön
        const ticket = {
          ...ticketResult[0],
          comments: [],
          attachments: []
        };
        
        return res.status(200).json({
          success: true,
          data: ticket,
          warning: 'Yorumlar alınamadı: ' + commentError.message
        });
      }
    } catch (ticketError: any) {
      console.error('Bilet sorgusu hatası:', ticketError);
      return res.status(500).json({
        success: false,
        message: 'Bilet bilgileri alınamadı',
        details: ticketError.message
      });
    }
  } catch (error: any) {
    console.error('Get ticket by ID API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından bilet bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
