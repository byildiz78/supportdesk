import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ticketId, content, isInternal, createdBy, attachments } = req.body;

    if (!ticketId || !content || !createdBy) {
      return res.status(400).json({ 
        message: 'Ticket ID, content, and created by are required' 
      });
    }

    // Use a transaction to handle comment and attachments
    return await db.executeTransaction(req, async (client) => {
      // Insert comment
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
          $1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, false
        )
        RETURNING id, created_at as "createdAt";
      `;

      const commentResult = await client.query(insertCommentQuery, [
        ticketId,
        content,
        isInternal || false,
        createdBy
      ]);

      if (commentResult.rows.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating comment' 
        });
      }

      const commentId = commentResult.rows[0].id;
      const createdAt = commentResult.rows[0].createdAt;

      // Get user name for the response
      const userQuery = `
        SELECT name FROM users WHERE id = $1 AND is_deleted = false
      `;
      
      const userResult = await client.query(userQuery, [createdBy]);
      const createdByName = userResult.rows.length > 0 ? userResult.rows[0].name : null;

      // Handle attachments if provided
      let commentAttachments = [];
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const attachment of attachments) {
          const insertAttachmentQuery = `
            INSERT INTO attachments (
              name,
              original_filename,
              size,
              mime_type,
              storage_path,
              public_url,
              entity_type,
              entity_id,
              created_at,
              created_by,
              updated_at,
              is_deleted
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, 'comment', $7, CURRENT_TIMESTAMP, $8, CURRENT_TIMESTAMP, false
            )
            RETURNING id, name, original_filename as "originalFilename", size, mime_type as "mimeType", 
                     public_url as "url", created_at as "uploadedAt";
          `;

          const attachmentResult = await client.query(insertAttachmentQuery, [
            attachment.name,
            attachment.originalFilename,
            attachment.size,
            attachment.mimeType,
            attachment.storagePath,
            attachment.url,
            commentId,
            createdBy
          ]);

          if (attachmentResult.rows.length > 0) {
            commentAttachments.push({
              ...attachmentResult.rows[0],
              uploadedBy: createdBy
            });
          }
        }
      }

      // Update ticket's updated_at timestamp
      await client.query(
        'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [ticketId]
      );

      // Return the created comment with attachments
      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: {
          id: commentId,
          ticketId,
          content,
          isInternal: isInternal || false,
          createdAt,
          createdBy,
          createdByName,
          attachments: commentAttachments
        }
      });
    });
  } catch (error: any) {
    console.error('Add ticket comment API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: error.message 
    });
  }
}
