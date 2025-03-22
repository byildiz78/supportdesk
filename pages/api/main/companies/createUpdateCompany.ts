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
    const { id, ...companyData } = req.body;
    const tenantId = extractTenantFromBody(req);

    // Tarih alanlarını düzgün formata dönüştür
    const formatDateForDB = (dateString: string | undefined) => {
      if (!dateString) return null;
      // Tarih geçerli mi kontrol et
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    // Flow tarih alanlarını formatlı
    const flow_ba_starting_date = formatDateForDB(companyData.flow_ba_starting_date);
    const flow_ba_end_date = formatDateForDB(companyData.flow_ba_end_date);

    // Eğer id varsa güncelleme, yoksa yeni kayıt
    if (id) {
      // Güncelleme işlemi
      const updateQuery = `
        UPDATE companies
        SET 
          name = $1,
          parent_company_id = $2,
          address = $3,
          phone = $4,
          email = $5,
          notes = $6,
          updated_at = CURRENT_TIMESTAMP,
          tax_id = $7,
          tax_office = $8,
          city = $9,
          state = $10,
          postal_code = $11,
          country = $12,
          website = $13,
          industry = $14,
          company_type = $15,
          is_active = $16,
          flow_ba_starting_date = $17,
          flow_ba_end_date = $18,
          flow_ba_notes = $19,
          flow_support_notes = $20,
          flow_licence_notes = $21
        WHERE id = $22
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: updateQuery,
        params: [
          companyData.name,
          companyData.parentCompanyId || null,
          companyData.address || null,
          companyData.phone || null,
          companyData.email || null,
          companyData.notes || null,
          companyData.taxId || null,
          companyData.taxOffice || null,
          companyData.city || null,
          companyData.state || null,
          companyData.postalCode || null,
          companyData.country || null,
          companyData.website || null,
          companyData.industry || null,
          companyData.companyType || null,
          companyData.isActive !== undefined ? companyData.isActive : true,
          flow_ba_starting_date,
          flow_ba_end_date,
          companyData.flow_ba_notes || null,
          companyData.flow_support_notes || null,
          companyData.flow_licence_notes || null,
          id
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Firma bulunamadı' });
      }

      return res.status(200).json({ success: true, message: 'Firma başarıyla güncellendi', id });
    } else {
      // Yeni kayıt işlemi
      const insertQuery = `
        INSERT INTO companies (
          name, 
          parent_company_id, 
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
          is_deleted,
          flow_ba_starting_date,
          flow_ba_end_date,
          flow_ba_notes,
          flow_support_notes,
          flow_licence_notes
        ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
          $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, false,
          $17, $18, $19, $20, $21
        )
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: insertQuery,
        params: [
          companyData.name,
          companyData.parentCompanyId || null,
          companyData.address || null,
          companyData.phone || null,
          companyData.email || null,
          companyData.notes || null,
          companyData.taxId || null,
          companyData.taxOffice || null,
          companyData.city || null,
          companyData.state || null,
          companyData.postalCode || null,
          companyData.country || null,
          companyData.website || null,
          companyData.industry || null,
          companyData.companyType || null,
          companyData.isActive !== undefined ? companyData.isActive : true,
          flow_ba_starting_date,
          flow_ba_end_date,
          companyData.flow_ba_notes || null,
          companyData.flow_support_notes || null,
          companyData.flow_licence_notes || null
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(500).json({ success: false, message: 'Firma eklenirken bir hata oluştu' });
      }

      const newId = result[0].id;
      return res.status(201).json({ success: true, message: 'Firma başarıyla eklendi', id: newId });
    }
  } catch (error: any) {
    console.error('Create/Update company API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}
