import { NextApiRequest, NextApiResponse } from 'next';
import { ParentCompany } from './parant-companies';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // SQL query for parent companies
    const query = `
        SELECT 
          id,
          -- uuid sütunu tabloda bulunmuyor, bu yüzden kaldırıldı
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
          is_deleted as "isDeleted"
      FROM parent_companies
      WHERE is_deleted = false
      ORDER BY name ASC;
    `;
    
    // Execute query with our database utility
    const parentCompanies = await db.executeQuery<ParentCompany[]>({
      query,
      req
    });
    // Return results
    return res.status(200).json(parentCompanies);
  } catch (error: any) {
    console.error('Parent companies API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
}