import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { ticketId } = req.query;

  if (!ticketId) {
    return res.status(400).json({ success: false, message: 'Ticket ID is required' });
  }

  try {
    // Add tenant ID to request body
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Get tags for the ticket
    const query = `
      SELECT t.id, t.name
      FROM tags t
      JOIN ticket_tags tt ON t.id = tt.tag_id
      WHERE tt.ticket_id = $1
      AND tt.is_deleted = false
      AND t.is_deleted = false
      ORDER BY t.name
    `;

    const result = await db.executeQuery<any[]>({
      query: query,
      params: [ticketId],
      req
    });
    
    return res.status(200).json({
      success: true,
      tags: result || []
    });
  } catch (error: any) {
    console.error('Error getting ticket tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get ticket tags',
      error: error.message
    });
  }
}
