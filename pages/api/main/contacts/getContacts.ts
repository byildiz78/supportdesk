import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company_id: string;
  company_name?: string;
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
    
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    let query = '';
    let params: any[] = [];

    if (companyId) {
      // Belirli bir firmaya ait kişileri getir
      query = `
        SELECT 
          c.id, 
          c.first_name,
          c.last_name,
          CONCAT(c.first_name, ' ', c.last_name) as name, 
          c.email, 
          c.phone, 
          c.position, 
          c.company_id,
          co.name as company_name
        FROM contacts c
        LEFT JOIN companies co ON c.company_id = co.id
        WHERE c.is_deleted = false AND c.company_id = $1
        ORDER BY c.first_name ASC, c.last_name ASC
      `;
      params = [companyId];
    } else {
      // Tüm kişileri getir
      query = `
        SELECT 
          c.id, 
          c.first_name,
          c.last_name,
          CONCAT(c.first_name, ' ', c.last_name) as name, 
          c.email, 
          c.phone, 
          c.position, 
          c.company_id,
          co.name as company_name
        FROM contacts c
        LEFT JOIN companies co ON c.company_id = co.id
        WHERE c.is_deleted = false
        ORDER BY c.first_name ASC, c.last_name ASC
      `;
    }

    const result = await db.executeQuery<Contact[]>({
      query,
      params,
      req
    });
    
    // Veritabanından gelen verileri kullan
    return res.status(200).json({
      success: true,
      data: result || []
    });
  } catch (error: any) {
    console.error('Get contacts API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından iletişim kişileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
