import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface DbResult {
  id: string;
  [key: string]: any;
}

// UUID formatını doğrulama fonksiyonu
const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('API çağrısı alındı - Request body:', JSON.stringify(req.body, null, 2));
    
    const { id, tags, ...ticketData } = req.body;
    const tenantId = extractTenantFromBody(req);
    
    console.log('Tenant ID:', tenantId);
    console.log('Ticket data:', JSON.stringify(ticketData, null, 2));
    console.log('Tags:', tags);

    // UUID alanlarını doğrula
    const safeTicketData = {
      ...ticketData,
      categoryId: isValidUUID(ticketData.categoryId) ? ticketData.categoryId : null,
      subcategoryId: isValidUUID(ticketData.subcategoryId) ? ticketData.subcategoryId : null,
      groupId: isValidUUID(ticketData.groupId) ? ticketData.groupId : null,
      assignedTo: isValidUUID(ticketData.assignedTo) ? ticketData.assignedTo : null,
      parent_company_id: isValidUUID(ticketData.parent_company_id) ? ticketData.parent_company_id : null,
      contact_id: isValidUUID(ticketData.contact_id) ? ticketData.contact_id : null
    };

    console.log('Güvenli ticket verileri:', JSON.stringify(safeTicketData, null, 2));

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      let ticketId: string;

      if (id) {
        // Update existing ticket
        const updateQuery = `
          UPDATE tickets
          SET 
            title = $1,
            description = $2,
            status = $3,
            priority = $4,
            source = $5,
            category_id = $6,
            subcategory_id = $7,
            group_id = $8,
            assigned_to = $9,
            customer_name = $10,
            customer_email = $11,
            customer_phone = $12,
            company_name = $13,
            company_id = $14,
            contact_position = $15,
            due_date = $16,
            resolution_time = $17,
            parent_company_id = $18,
            contact_id = $19,
            sla_breach = $20,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $21
          WHERE id = $22
          RETURNING id;
        `;

        console.log('Update query:', updateQuery);
        console.log('Update parameters:', [
          safeTicketData.title,
          safeTicketData.description,
          safeTicketData.status,
          safeTicketData.priority,
          safeTicketData.source,
          safeTicketData.categoryId,
          safeTicketData.subcategoryId,
          safeTicketData.groupId,
          safeTicketData.assignedTo,
          safeTicketData.customer_name,
          safeTicketData.customer_email,
          safeTicketData.customer_phone,
          safeTicketData.company_name,
          safeTicketData.company_id,
          safeTicketData.contact_position,
          safeTicketData.due_date,
          safeTicketData.resolution_time,
          safeTicketData.parent_company_id,
          safeTicketData.contact_id,
          safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
          safeTicketData.updatedBy,
          id
        ]);

        const result = await client.query(updateQuery, [
          safeTicketData.title,
          safeTicketData.description,
          safeTicketData.status,
          safeTicketData.priority,
          safeTicketData.source,
          safeTicketData.categoryId,
          safeTicketData.subcategoryId,
          safeTicketData.groupId,
          safeTicketData.assignedTo,
          safeTicketData.customer_name,
          safeTicketData.customer_email,
          safeTicketData.customer_phone,
          safeTicketData.company_name,
          safeTicketData.company_id,
          safeTicketData.contact_position,
          safeTicketData.due_date,
          safeTicketData.resolution_time,
          safeTicketData.parent_company_id,
          safeTicketData.contact_id,
          safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
          safeTicketData.updatedBy,
          id
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticketId = id;
      } else {
        // Create new ticket
        const insertQuery = `
          INSERT INTO tickets (
            title,
            description,
            status,
            priority,
            source,
            category_id,
            subcategory_id,
            group_id,
            assigned_to,
            customer_name,
            customer_email,
            customer_phone,
            company_name,
            company_id,
            contact_position,
            due_date,
            resolution_time,
            parent_company_id,
            contact_id,
            sla_breach,
            created_at,
            created_by,
            updated_at,
            is_deleted
          ) 
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            CURRENT_TIMESTAMP, $21, CURRENT_TIMESTAMP, false
          )
          RETURNING id;
        `;

        console.log('Insert query:', insertQuery);
        console.log('Insert parameters:', [
          safeTicketData.title,
          safeTicketData.description,
          safeTicketData.status,
          safeTicketData.priority,
          safeTicketData.source,
          safeTicketData.categoryId,
          safeTicketData.subcategoryId,
          safeTicketData.groupId,
          safeTicketData.assignedTo,
          safeTicketData.customer_name,
          safeTicketData.customer_email,
          safeTicketData.customer_phone,
          safeTicketData.company_name,
          safeTicketData.company_id,
          safeTicketData.contact_position,
          safeTicketData.due_date,
          safeTicketData.resolution_time,
          safeTicketData.parent_company_id,
          safeTicketData.contact_id,
          safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
          safeTicketData.createdBy
        ]);

        try {
          const result = await client.query(insertQuery, [
            safeTicketData.title,
            safeTicketData.description,
            safeTicketData.status,
            safeTicketData.priority,
            safeTicketData.source,
            safeTicketData.categoryId,
            safeTicketData.subcategoryId,
            safeTicketData.groupId,
            safeTicketData.assignedTo,
            safeTicketData.customer_name,
            safeTicketData.customer_email,
            safeTicketData.customer_phone,
            safeTicketData.company_name,
            safeTicketData.company_id,
            safeTicketData.contact_position,
            safeTicketData.due_date,
            safeTicketData.resolution_time,
            safeTicketData.parent_company_id,
            safeTicketData.contact_id,
            safeTicketData.sla_breach !== undefined ? safeTicketData.sla_breach : false,
            safeTicketData.createdBy
          ]);

          console.log('Insert result:', result);

          if (result.rows.length === 0) {
            return res.status(500).json({ success: false, message: 'Error creating ticket' });
          }

          ticketId = result.rows[0].id;
        } catch (queryError: any) {
          console.error('SQL query error:', queryError);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error while creating ticket', 
            details: queryError.message 
          });
        }
      }

      // Handle tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // First, remove existing tag associations if updating
        if (id) {
          await client.query(
            'UPDATE ticket_tags SET is_deleted = true WHERE ticket_id = $1',
            [ticketId]
          );
        }

        // Then add new tag associations
        for (const tagName of tags) {
          // Check if tag exists, if not create it
          const tagQuery = `
            SELECT id FROM tags WHERE name = $1 AND is_deleted = false
          `;
          const tagResult = await client.query(tagQuery, [tagName]);
          
          let tagId: string;
          
          if (tagResult.rows.length === 0) {
            // Create new tag
            const createTagQuery = `
              INSERT INTO tags (name, created_at, updated_at, is_deleted)
              VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
              RETURNING id
            `;
            const newTagResult = await client.query(createTagQuery, [tagName]);
            tagId = newTagResult.rows[0].id;
          } else {
            tagId = tagResult.rows[0].id;
          }
          
          // Create ticket-tag association
          const ticketTagQuery = `
            INSERT INTO ticket_tags (
              ticket_id, tag_id, created_at, updated_at, is_deleted
            )
            VALUES (
              $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false
            )
            ON CONFLICT (ticket_id, tag_id) 
            DO UPDATE SET is_deleted = false, updated_at = CURRENT_TIMESTAMP
          `;
          
          await client.query(ticketTagQuery, [ticketId, tagId]);
        }
      }

      console.log('Ticket created/updated successfully with ID:', ticketId);
      return res.status(id ? 200 : 201).json({ 
        success: true, 
        message: id ? 'Ticket updated successfully' : 'Ticket created successfully', 
        id: ticketId 
      });
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
