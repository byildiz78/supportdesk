import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    // Query to get comments with user information
    const query = `
      SELECT 
        tc.id,
        tc.ticket_id as "ticketId",
        tc.content,
        tc.is_internal as "isInternal",
        tc.created_at as "createdAt",
        tc.created_by as "createdBy",
        u.name as "createdByName"
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE tc.ticket_id = $1 AND tc.is_deleted = false
      ORDER BY tc.created_at ASC
    `;
    
    const comments = await db.executeQuery<any[]>({
      query,
      params: [ticketId],
      req
    });

    // For each comment, fetch attachments
    const commentsWithAttachments = await Promise.all(
      comments.map(async (comment: any) => {
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
          WHERE entity_type = 'comment' AND entity_id = $1 AND is_deleted = false
        `;
        
        const attachments = await db.executeQuery<any[]>({
          query: attachmentsQuery,
          params: [comment.id],
          req
        });
        
        return {
          ...comment,
          attachments
        };
      })
    );

    return res.status(200).json(commentsWithAttachments);
  } catch (error: any) {
    console.error('Get ticket comments API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}
