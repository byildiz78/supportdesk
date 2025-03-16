import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Company {
  id: string;
  name: string;
  parent_company_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  tax_office?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;
    
    console.log('getCompanyById API çağrıldı, companyId:', companyId);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Firma ID parametresi gereklidir'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const query = `
      SELECT 
        c.id,
        c.name,
        c.parent_company_id,
        c.address,
        c.phone,
        c.email,
        c.website,
        c.tax_number,
        c.tax_office
      FROM companies c
      WHERE c.is_deleted = false AND c.id = $1
    `;
    
    const params = [companyId];

    const result = await db.executeQuery<Company[]>({
      query,
      params,
      req
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }
    
    console.log('Firma bilgisi döndürülüyor:', result[0]);
    
    return res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('getCompanyById API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından firma bilgisi alınırken bir hata oluştu',
      details: error.message
    });
  }
}
