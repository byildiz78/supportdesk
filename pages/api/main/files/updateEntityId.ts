import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface QueryResult {
  rows: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { fileIds, entityType, entityId } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'File IDs are required' 
      });
    }

    if (!entityType || !entityId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entity type and ID are required' 
      });
    }

    // Update the entity type and ID for each file
    const updateQuery = `
      UPDATE attachments
      SET 
        entity_type = $1,
        entity_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($3)
      RETURNING id;
    `;

    const result = await db.executeQuery<QueryResult>({
      query: updateQuery,
      params: [
        entityType,
        entityId,
        fileIds
      ],
      req
    });

    const updatedCount = result.rows.length;

    return res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} file(s)`,
      updatedFiles: result.rows
    });
  } catch (error: any) {
    console.error('Update entity ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating entity ID',
      details: error.message
    });
  }
}
