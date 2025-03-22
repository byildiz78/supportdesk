import { NextApiRequest, NextApiResponse } from 'next';
import { Company } from '@/stores/main/companies-store';
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
    const { tenantId } = req.body;

    // SQL query for companies
    const query = `
        SELECT 
          id,
          parent_company_id as "parentCompanyId",
          name,
          tax_id as "taxId",
          tax_office as "taxOffice",
          address,
          city,
          state,
          postal_code as "postalCode",
          country,
          phone,
          email,
          website,
          industry,
          company_type as "companyType",
          notes,
          is_active as "isActive",
          created_at as "createdAt",
          created_by as "createdBy",
          updated_at as "updatedAt",
          updated_by as "updatedBy",
          is_deleted as "isDeleted",
          flow_ba_starting_date,
          flow_ba_end_date,
          flow_ba_notes,
          flow_support_notes,
          flow_licence_notes,
          flow_id,
          flow_last_update_date
      FROM companies
      WHERE is_deleted = false
      ORDER BY name ASC;
    `;
    
    // Execute query with our database utility
    const companies = await db.executeQuery<Company[]>({
      query,
      req
    });
    // Return results
    return res.status(200).json(companies);
  } catch (error: any) {
    console.error('Companies API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}