import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Category {
  id: string;
  name: string;
  description: string | null;
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
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM categories
      WHERE is_deleted = false
      ORDER BY name ASC
    `;

    const result = await db.executeQuery<Category[]>({
      query,
      params: [],
      req
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get categories API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
