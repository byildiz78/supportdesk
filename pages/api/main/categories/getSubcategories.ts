import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { categoryId } = req.query;
    console.log('Alt kategoriler API çağrıldı, categoryId:', categoryId);

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const query = `
      SELECT 
        id, 
        name, 
        description,
        category_id as "categoryId",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM subcategories
      WHERE category_id = $1 AND is_deleted = false
      ORDER BY name ASC
    `;

    const result = await db.executeQuery<Subcategory[]>({
      query,
      params: [categoryId],
      req
    });
    
    console.log(`${result.length} alt kategori bulundu`);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get subcategories API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
