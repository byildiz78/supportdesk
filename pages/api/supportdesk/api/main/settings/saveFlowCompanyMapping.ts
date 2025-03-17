import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { mapping } = req.body;
    const tenantId = extractTenantFromBody(req);

    if (!mapping || !mapping.mappings || !Array.isArray(mapping.mappings)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli eşleştirme verisi bulunamadı' 
      });
    }

    // Eşleştirme verilerini JSON olarak hazırla
    const mappingJson = JSON.stringify(mapping.mappings);
    
    // Eşleştirme kaydı var mı kontrol et
    const checkQuery = `
      SELECT id FROM settings 
      WHERE key = 'flow_company_mapping' AND is_deleted = false
    `;
    
    const existingMapping = await db.executeQuery<{id: string}[]>({
      query: checkQuery,
      params: [],
      req
    });

    let mappingId = mapping.id;
    
    if (existingMapping && existingMapping.length > 0) {
      // Mevcut eşleştirmeyi güncelle
      const updateQuery = `
        UPDATE settings
        SET 
          value = $1,
          metadata = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id;
      `;

      const metadata = {
        name: mapping.name,
        isDefault: mapping.isDefault,
        createdAt: mapping.createdAt,
        updatedAt: new Date().toISOString()
      };

      const result = await db.executeQuery<{id: string}[]>({
        query: updateQuery,
        params: [
          mappingJson,
          JSON.stringify(metadata),
          existingMapping[0].id
        ],
        req
      });

      mappingId = existingMapping[0].id;
    } else {
      // Yeni eşleştirme kaydı oluştur
      const insertQuery = `
        INSERT INTO settings (
          id,
          key, 
          value, 
          metadata,
          created_at, 
          updated_at,
          is_deleted
        ) 
        VALUES (
          $1, $2, $3, $4, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
          false
        )
        RETURNING id;
      `;

      mappingId = uuidv4();
      
      const metadata = {
        name: mapping.name,
        isDefault: mapping.isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await db.executeQuery<{id: string}[]>({
        query: insertQuery,
        params: [
          mappingId,
          'flow_company_mapping',
          mappingJson,
          JSON.stringify(metadata)
        ],
        req
      });
    }

    // Güncellenmiş eşleştirme verisini hazırla
    const updatedMapping: FieldMapping = {
      id: mappingId,
      name: mapping.name,
      mappings: mapping.mappings,
      isDefault: mapping.isDefault,
      createdAt: mapping.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({ 
      success: true, 
      message: 'Eşleştirme başarıyla kaydedildi',
      mapping: updatedMapping
    });
  } catch (error: any) {
    console.error('Save flow company mapping API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Eşleştirme kaydedilirken bir hata oluştu',
      details: error.message 
    });
  }
}
