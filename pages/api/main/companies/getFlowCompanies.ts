import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  tax_id?: string;
  tax_office?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  industry?: string;
  company_type?: string;
  is_active: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Arama terimi varsa WHERE koşulunu oluştur
    const searchCondition = search 
      ? `AND (name ILIKE $3 OR email ILIKE $3 OR phone ILIKE $3 OR notes ILIKE $3)` 
      : '';
    
    // Toplam kayıt sayısını al
    const countQuery = `
      SELECT COUNT(*) as total
      FROM companies
      WHERE is_deleted = false
      AND notes LIKE '%Flow''dan içe aktarıldı%'
      ${search ? 'AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR notes ILIKE $1)' : ''}
    `;
    
    const countParams = search ? [`%${search}%`] : [];
    
    const countResult = await db.executeQuery<{total: string}[]>({
      query: countQuery,
      params: countParams,
      req
    });
    
    const total = countResult?.[0]?.total || 0;
    
    // Firmaları getir
    const query = `
      SELECT 
        id,
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
        is_active
      FROM companies
      WHERE is_deleted = false
      AND notes LIKE '%Flow''dan içe aktarıldı%'
      ${searchCondition}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const params = search 
      ? [limitNumber, offset, `%${search}%`] 
      : [limitNumber, offset];
    
    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const result = await db.executeQuery<Company[]>({
      query,
      params,
      req
    });
    
    // Veritabanından gelen verileri kullan
    return res.status(200).json({
      success: true,
      data: result || [],
      pagination: {
        total: parseInt(total as string, 10),
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(parseInt(total as string, 10) / limitNumber)
      }
    });
  } catch (error: any) {
    console.error('Get flow companies API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından flow firma bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
