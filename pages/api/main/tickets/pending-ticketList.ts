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

    const {date1, date2 } = req.body;
    let query = `
      SELECT 
        t.id,
        t.ticketno,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.source,
        t.category_id as "categoryId",
        t.subcategory_id as "subcategoryId",
        t.group_id as "groupId",
        t.assigned_to as "assignedTo",
        u.name as "assignedUserName",
        t.customer_name as "customerName",
        t.customer_email as "customerEmail",
        t.customer_phone as "customerPhone",
        t.company_name as "companyName",
        t.company_id as "companyId",
        t.contact_position as "contactPosition",
        t.due_date as "dueDate",
        t.resolution_time as "resolutionTime",
        t.created_at as "createdAt",
        t.created_by as "createdBy",
        t.updated_at as "updatedAt",
        t.updated_by as "updatedBy"
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE (t.is_deleted = false OR t.is_deleted IS NULL)
      AND t.status = 'waiting'
      AND (t.created_at BETWEEN $1 AND $2)
      ORDER BY t.created_at DESC
    `;

    // Execute query with our database utility
    const tickets = await db.executeQuery<any[]>({
      query,
      params: [date1, date2],
      req
    });

    // Return results directly
    return res.status(200).json(tickets);
  } catch (error: any) {
    console.error('Tickets API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}
