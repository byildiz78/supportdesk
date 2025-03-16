import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

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

    // Bilet yorumlarını getir
    const commentsQuery = `
      SELECT 
        tc.id,
        tc.ticket_id,
        tc.content,
        tc.is_internal,
        tc.created_at,
        tc.created_by,
        u.name as created_by_name,
        tc.updated_at,
        tc.updated_by
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE tc.ticket_id = $1::uuid AND tc.is_deleted = false
      ORDER BY tc.created_at ASC
    `;

    try {
      const commentsResult = await db.executeQuery<any[]>({
        query: commentsQuery,
        params: [ticketId],
        req
      });

      // Yorumlar için ekleri getir
      const commentsWithAttachments = await Promise.all(commentsResult.map(async (comment) => {
        const attachmentsQuery = `
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
          WHERE entity_type = 'comment' AND entity_id = $1::uuid AND is_deleted = false
        `;

        try {
          const attachmentsResult = await db.executeQuery<any[]>({
            query: attachmentsQuery,
            params: [comment.id],
            req
          });

          return {
            ...comment,
            attachments: attachmentsResult || []
          };
        } catch (error) {
          console.error('Yorum ekleri sorgusu hatası:', error);
          return {
            ...comment,
            attachments: []
          };
        }
      }));

      return res.status(200).json({
        success: true,
        data: commentsWithAttachments
      });
    } catch (error: any) {
      console.error('Yorum sorgusu hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Yorumlar alınamadı',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error('Get ticket comments API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
