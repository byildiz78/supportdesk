import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface MappingField {
  sourceField: string;
  targetField: string;
  description: string;
}

interface FieldMapping {
  id: string;
  name: string;
  mappings: MappingField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Eşleştirme kaydını getir
    const query = `
      SELECT id, key, value, metadata, created_at, updated_at
      FROM settings
      WHERE key = 'flow_company_mapping' AND is_deleted = false
    `;
    
    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const result = await db.executeQuery<{id: string, key: string, value: string, metadata: string, created_at: string, updated_at: string}[]>({
      query,
      params: [],
      req
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Eşleştirme bulunamadı'
      });
    }
    
    const mappingRecord = result[0];
    const mappings = JSON.parse(mappingRecord.value) as MappingField[];
    const metadata = JSON.parse(mappingRecord.metadata || '{}');
    
    const mapping: FieldMapping = {
      id: mappingRecord.id,
      name: metadata.name || 'Varsayılan Eşleştirme',
      mappings,
      isDefault: metadata.isDefault || true,
      createdAt: metadata.createdAt || mappingRecord.created_at,
      updatedAt: metadata.updatedAt || mappingRecord.updated_at
    };
    
    return res.status(200).json({
      success: true,
      mapping
    });
  } catch (error: any) {
    console.error('Get flow company mapping API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Eşleştirme alınırken bir hata oluştu',
      details: error.message
    });
  }
}
