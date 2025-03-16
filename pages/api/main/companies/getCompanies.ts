import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Company {
  id: string;
  name: string;
  parent_company_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { parentCompanyId } = req.query;
    
    console.log('Firmalar API çağrıldı, parentCompanyId:', parentCompanyId);

    // companiesList.ts ile aynı yapıda sorgu kullanıyoruz
    const query = `
      SELECT 
        id,
        name,
        parent_company_id
      FROM companies
      WHERE is_deleted = false
      ${parentCompanyId ? 'AND parent_company_id = $1' : 'AND parent_company_id IS NULL'}
      ORDER BY name ASC
    `;

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    // Orijinal req nesnesini kopyalamak yerine, sadece body'yi değiştiriyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const result = await db.executeQuery<Company[]>({
      query,
      params: parentCompanyId ? [parentCompanyId] : [],
      req
    });
    
    // Veritabanından gelen verileri kullan
    console.log('Firmalar döndürülüyor:', result);
    
    return res.status(200).json({
      success: true,
      data: result || []
    });
  } catch (error: any) {
    console.error('Get companies API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından firma bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
