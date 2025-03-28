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
    const { contactId } = req.query;
    
    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Kişi ID parametresi gereklidir'
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
      WHERE c.is_deleted = false AND c.id = $1
    `;
    
    const params = [contactId];

    const result = await db.executeQuery<Contact[]>({
      query,
      params,
      req
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kişi bulunamadı'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('getContactById API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından iletişim kişisi alınırken bir hata oluştu',
      details: error.message
    });
  }
}
