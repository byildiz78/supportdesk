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
    // Extract date range and filters from request body
    const { date1, date2, filter } = req.body;
    
    // Build the query to get tickets with category, subcategory, and group information
    let query = `
        SELECT 
        t.id,
        t.ticketno,
        t.title,
        t.status,
        t.priority,
        c.name as "categoryName",
        cs.name as "subcategoryName",
        g.name as "groupName",
        t.company_name as "companyName",
        t.created_at as "createdAt"
      FROM tickets t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN subcategories cs ON cs.id = t.subcategory_id
      LEFT JOIN groups g ON g.id = t.group_id
      WHERE 
      t.created_at BETWEEN $1 AND $2
    `;

    const params = [date1, date2];
    let paramIndex = 3;

    // Add category filter if provided
    if (filter && filter.selectedCategories && filter.selectedCategories.length > 0) {
      query += ` AND c.name = ANY($${paramIndex})`;
      params.push(filter.selectedCategories);
      paramIndex++;
    }

    // Execute query with our database utility
    const tickets = await db.executeQuery<any[]>({
      query,
      params,
      req
    });

    // Return results directly
    return res.status(200).json(tickets);
  } catch (error: any) {
    console.error('Department Heatmap API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
