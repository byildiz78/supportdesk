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
    console.log('Tickets API request received:', req.body);
    console.log('Filters received:', req.body.filters);
    
    // Extract tenant ID from request body
    const { tenantId, filters } = req.body;
    
    // Build the query based on the exact schema provided
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
    `;

    // Add filter conditions if provided
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        console.log('Applying status filter:', filters.status);
        query += ` AND t.status = ANY($${paramIndex}::varchar[])`;
        params.push(filters.status);
        paramIndex++;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        console.log('Applying priority filter:', filters.priority);
        query += ` AND t.priority = ANY($${paramIndex}::varchar[])`;
        params.push(filters.priority);
        paramIndex++;
      }

      // Category filter
      if (filters.category && filters.category.length > 0) {
        console.log('Applying category filter:', filters.category);
        query += ` AND t.category_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.category);
        paramIndex++;
      }

      // Subcategory filter
      if (filters.subcategory && filters.subcategory.length > 0) {
        console.log('Applying subcategory filter:', filters.subcategory);
        query += ` AND t.subcategory_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.subcategory);
        paramIndex++;
      }

      // Group filter
      if (filters.group && filters.group.length > 0) {
        console.log('Applying group filter:', filters.group);
        query += ` AND t.group_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.group);
        paramIndex++;
      }

      // Assigned to filter
      if (filters.assigned_to && filters.assigned_to.length > 0) {
        console.log('Applying assigned to filter:', filters.assigned_to);
        query += ` AND t.assigned_to = ANY($${paramIndex}::uuid[])`;
        params.push(filters.assigned_to);
        paramIndex++;
      }

      // Parent company filter
      if (filters.parent_company_id && filters.parent_company_id.length > 0) {
        console.log('Applying parent company filter:', filters.parent_company_id);
        query += ` AND t.parent_company_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.parent_company_id);
        paramIndex++;
      }

      // Company filter
      if (filters.company_id && filters.company_id.length > 0) {
        console.log('Applying company filter:', filters.company_id);
        query += ` AND t.company_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.company_id);
        paramIndex++;
      }

      // Contact filter
      if (filters.contact_id && filters.contact_id.length > 0) {
        console.log('Applying contact filter:', filters.contact_id);
        query += ` AND t.contact_id = ANY($${paramIndex}::uuid[])`;
        params.push(filters.contact_id);
        paramIndex++;
      }

      // Date range filter
      if (filters.date_range && filters.date_range.from && filters.date_range.to) {
        console.log('Applying date range filter:', filters.date_range);
        query += ` AND t.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(filters.date_range.from, filters.date_range.to);
        paramIndex += 2;
      }

      // SLA breach filter
      if (filters.sla_breach !== undefined) {
        console.log('Applying SLA breach filter:', filters.sla_breach);
        query += ` AND t.sla_breach = $${paramIndex}`;
        params.push(filters.sla_breach);
        paramIndex++;
      }
    }

    // Add order by clause
    query += ` ORDER BY t.created_at DESC`;

    // Execute query with our database utility
    const tickets = await db.executeQuery<any[]>({
      query,
      params,
      req
    });

    console.log('Final SQL query:', query);
    console.log('Query parameters:', params);
    console.log('Number of tickets returned:', tickets.length);
    
    // Debug: Log the first few tickets to check their status
    if (tickets.length > 0) {
      console.log('Sample ticket data:', tickets.slice(0, 2));
    }
    
    // Skip tag fetching for now to simplify troubleshooting
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
