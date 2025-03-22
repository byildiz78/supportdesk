import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Group {
  id: string;
  name: string;
  description: string | null;
  subcategoryId: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  mesaiSaatleriSla: number;
  mesaiDisiSla: number;
  haftaSonuMesaiSla: number;
  haftaSonuMesaiDisiSla: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subcategoryId } = req.query;
    if (!subcategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID is required'
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
        subcategory_id as "subcategoryId",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy",
        mesai_saatleri_sla as "mesaiSaatleriSla",
        mesai_disi_sla as "mesaiDisiSla",
        hafta_sonu_mesai_sla as "haftaSonuMesaiSla",
        hafta_sonu_mesai_disi_sla as "haftaSonuMesaiDisiSla"
      FROM groups
      WHERE subcategory_id = $1 AND is_deleted = false
      ORDER BY name ASC
    `;

    const result = await db.executeQuery<Group[]>({
      query,
      params: [subcategoryId],
      req
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get groups API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
