import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sadece GET isteklerine izin ver
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    // Atlanacak kayıt sayısını hesapla
    const skip = (page - 1) * limit;

    // Toplam kayıt sayısını al
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM companies 
      WHERE flow_id IS NOT NULL AND is_deleted = false
    `;
    
    let queryParams: any[] = [];
    
    // Arama filtresi ekle
    if (search) {
      countQuery += ` AND (
        name ILIKE $1 OR
        email ILIKE $1 OR
        phone ILIKE $1 OR
        address ILIKE $1 OR
        city ILIKE $1 OR
        country ILIKE $1
      )`;
      queryParams.push(`%${search}%`);
    }
    
    const countResult = await db.executeQuery<{total: number}[]>({
      query: countQuery,
      params: queryParams,
      req: req
    });
    
    const total = countResult[0]?.total || 0;

    // Firmaları getir
    let companiesQuery = `
      SELECT * 
      FROM companies 
      WHERE flow_id IS NOT NULL AND is_deleted = false
    `;
    
    let companyParams = [...queryParams];
    
    // Arama filtresi ekle
    if (search) {
      companiesQuery += ` AND (
        name ILIKE $1 OR
        email ILIKE $1 OR
        phone ILIKE $1 OR
        address ILIKE $1 OR
        city ILIKE $1 OR
        country ILIKE $1
      )`;
    }
    
    // Sıralama ve sayfalama ekle
    companiesQuery += ` ORDER BY created_at DESC LIMIT $${companyParams.length + 1} OFFSET $${companyParams.length + 2}`;
    companyParams.push(limit, skip);
    
    const companies = await db.executeQuery<DbResult[]>({
      query: companiesQuery,
      params: companyParams,
      req: req
    });

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching flow companies:', error);
    return res.status(500).json({
      success: false,
      message: 'Flow firmaları alınırken bir hata oluştu',
      error: (error as Error).message
    });
  }
}
