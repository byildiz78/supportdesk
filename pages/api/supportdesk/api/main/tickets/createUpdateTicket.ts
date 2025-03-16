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
    const {
      id,
      title,
      description,
      status,
      priority,
      category_id,
      subcategory_id,
      company_id,
      company_name,
      contact_id,
      customer_name,
      customer_email,
      customer_phone,
      contact_position,
      assigned_to,
      due_date,
      isUpdate,
      parent_company_id,
      ...otherFields
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Prepare database query parameters
    const params = [
      title,
      description || '',
      status || 'open',
      priority || 'medium',
      category_id,
      subcategory_id,
      company_id,
      company_name,
      contact_id,
      customer_name,
      customer_email,
      customer_phone,
      contact_position,
      assigned_to,
      due_date,
      parent_company_id
    ];

    let query;
    let ticketId;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      if (isUpdate && id) {
        // Update existing ticket
        ticketId = id;
        query = `
          UPDATE tickets
          SET
            title = $1,
            description = $2,
            status = $3,
            priority = $4,
            category_id = $5,
            subcategory_id = $6,
            company_id = $7,
            company_name = $8,
            contact_id = $9,
            customer_name = $10,
            customer_email = $11,
            customer_phone = $12,
            contact_position = $13,
            assigned_to = $14,
            due_date = $15,
            parent_company_id = $16,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $17
          WHERE id = $18
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.updated_by || null,
          id
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Ticket not found'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Ticket updated successfully',
          data: result.rows[0]
        });
      } else {
        // Create new ticket
        query = `
          INSERT INTO tickets (
            title,
            description,
            status,
            priority,
            category_id,
            subcategory_id,
            company_id,
            company_name,
            contact_id,
            customer_name,
            customer_email,
            customer_phone,
            contact_position,
            assigned_to,
            due_date,
            parent_company_id,
            created_at,
            created_by,
            updated_at,
            is_deleted
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            CURRENT_TIMESTAMP, $17, CURRENT_TIMESTAMP, false
          )
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.created_by || null
        ]);

        return res.status(201).json({
          success: true,
          message: 'Ticket created successfully',
          data: result.rows[0]
        });
      }
    });
  } catch (error: any) {
    console.error('Create/Update ticket API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
