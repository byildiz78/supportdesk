import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, ...parentCompanyData } = req.body;
    const tenantId = extractTenantFromBody(req);

    // Eğer id varsa güncelleme, yoksa yeni kayıt
    if (id) {
      // Güncelleme işlemi
      const updateQuery = `
        UPDATE parent_companies
        SET 
          name = $1,
          address = $2,
          phone = $3,
          email = $4,
          notes = $5,
          updated_at = CURRENT_TIMESTAMP,
          tax_id = $6,
          tax_office = $7,
          city = $8,
          state = $9,
          postal_code = $10,
          country = $11,
          website = $12,
          industry = $13,
          company_type = $14,
          is_active = $15
        WHERE id = $16
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: updateQuery,
        params: [
          parentCompanyData.name,
          parentCompanyData.address || null,
          parentCompanyData.phone || null,
          parentCompanyData.email || null,
          parentCompanyData.notes || null,
          parentCompanyData.taxId || null,
          parentCompanyData.taxOffice || null,
          parentCompanyData.city || null,
          parentCompanyData.state || null,
          parentCompanyData.postalCode || null,
          parentCompanyData.country || null,
          parentCompanyData.website || null,
          parentCompanyData.industry || null,
          parentCompanyData.companyType || null,
          parentCompanyData.isActive !== undefined ? parentCompanyData.isActive : true,
          id
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Ana şirket bulunamadı' });
      }

      return res.status(200).json({ success: true, message: 'Ana şirket başarıyla güncellendi', id });
    } else {
      // Yeni kayıt işlemi
      const insertQuery = `
        INSERT INTO parent_companies (
          name, 
          address, 
          phone, 
          email, 
          notes, 
          created_at, 
          updated_at, 
          tax_id, 
          tax_office, 
          city, 
          state, 
          postal_code, 
          country, 
          website, 
          industry, 
          company_type, 
          is_active,
          is_deleted
        ) 
        VALUES (
          $1, $2, $3, $4, $5, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
          $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false
        )
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: insertQuery,
        params: [
          parentCompanyData.name,
          parentCompanyData.address || null,
          parentCompanyData.phone || null,
          parentCompanyData.email || null,
          parentCompanyData.notes || null,
          parentCompanyData.taxId || null,
          parentCompanyData.taxOffice || null,
          parentCompanyData.city || null,
          parentCompanyData.state || null,
          parentCompanyData.postalCode || null,
          parentCompanyData.country || null,
          parentCompanyData.website || null,
          parentCompanyData.industry || null,
          parentCompanyData.companyType || null,
          parentCompanyData.isActive !== undefined ? parentCompanyData.isActive : true
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(500).json({ success: false, message: 'Ana şirket eklenirken bir hata oluştu' });
      }

      const newId = result[0].id;
      return res.status(201).json({ success: true, message: 'Ana şirket başarıyla eklendi', id: newId });
    }
  } catch (error: any) {
    console.error('Create/Update parent company API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}
