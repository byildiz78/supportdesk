import { NextApiRequest, NextApiResponse } from 'next';
import { Contact } from '@/stores/main/contacts-store';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract tenant ID from request body
    const { tenantId, companyId } = req.body;

    // SQL query for contacts
    let query = `
        SELECT 
          id,
          company_id as "companyId",
          first_name as "firstName",
          last_name as "lastName",
          position,
          email,
          phone,
          mobile,
          address,
          city,
          state,
          postal_code as "postalCode",
          country,
          notes,
          is_primary as "isPrimary",
          is_active as "isActive",
          created_at as "createdAt",
          created_by as "createdBy",
          updated_at as "updatedAt",
          updated_by as "updatedBy",
          is_deleted as "isDeleted"
      FROM contacts
      WHERE is_deleted = false
      and is_active = true
    `;
    
    // If companyId is provided, filter contacts by company
    const params = [];
    if (companyId) {
      query += ` AND company_id = $1`;
      params.push(companyId);
    }
    
    // Add order by clause
    query += ` ORDER BY first_name ASC, last_name ASC`;
    
    // Execute query with our database utility
    const contacts = await db.executeQuery<Contact[]>({
      query,
      params,
      req
    });
    
    // Return results
    return res.status(200).json(contacts);
  } catch (error: any) {
    console.error('Contacts API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}
