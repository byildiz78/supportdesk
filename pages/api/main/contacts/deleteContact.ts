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
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    // Soft delete by setting is_deleted to true
    const query = `
      UPDATE contacts
      SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id;
    `;
    
    const result = await db.executeQuery<any[]>({
      query,
      params: [id],
      req
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({ message: 'Contact deleted successfully', id });
  } catch (error: any) {
    console.error('Delete contact API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}
