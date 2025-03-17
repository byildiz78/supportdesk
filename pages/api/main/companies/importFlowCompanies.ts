import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface FlowCompanyImport {
  [key: string]: any;
}

interface DbResult {
  id: string;
  [key: string]: any;
}

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
    const { companies } = req.body;
    const tenantId = extractTenantFromBody(req);

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli firma verisi bulunamadı' 
      });
    }

    // Alan eşleştirmelerini getir
    const mappingQuery = `
      SELECT value FROM settings 
      WHERE key = 'flow_company_mapping' AND is_deleted = false
    `;

    const mappingResult = await db.executeQuery<{value: string}[]>({
      query: mappingQuery,
      params: [],
      req
    });

    let fieldMapping: FieldMapping | null = null;
    
    if (mappingResult && mappingResult.length > 0) {
      try {
        fieldMapping = JSON.parse(mappingResult[0].value);
      } catch (e) {
        console.error('Error parsing field mapping:', e);
      }
    }

    // Varsayılan eşleştirme yoksa basit eşleştirme kullan
    const defaultMapping: MappingField[] = [
      { sourceField: "TITLE", targetField: "name", description: "Firma Adı" },
      { sourceField: "ADDRESS", targetField: "address", description: "Adres" },
      { sourceField: "PHONE", targetField: "phone", description: "Telefon" },
      { sourceField: "EMAIL", targetField: "email", description: "E-posta" },
      { sourceField: "ADDRESS_CITY", targetField: "city", description: "Şehir" },
      { sourceField: "ADDRESS_COUNTRY", targetField: "country", description: "Ülke" },
      { sourceField: "ID", targetField: "flow_id", description: "Flow ID" }
    ];

    const mappings = fieldMapping?.mappings || defaultMapping;

    // İçe aktarılan firmaları kaydet
    const importedCompanies: string[] = [];
    
    for (const flowCompany of companies) {
      // Firma adı zorunlu alan - eşleştirmeden name alanını bul
      const nameMapping = mappings.find(m => m.targetField === 'name');
      const nameField = nameMapping ? nameMapping.sourceField : 'TITLE';
      
      if (!flowCompany[nameField]) {
        continue;
      }

      // Önce bu isimde firma var mı kontrol et
      const checkQuery = `
        SELECT id FROM companies 
        WHERE name = $1 AND is_deleted = false
      `;
      
      const existingCompany = await db.executeQuery<DbResult[]>({
        query: checkQuery,
        params: [flowCompany[nameField]],
        req
      });

      // Eğer firma zaten varsa, atla
      if (existingCompany && existingCompany.length > 0) {
        continue;
      }

      // Eşleştirmeye göre firma verilerini hazırla
      const companyData: Record<string, any> = {};
      
      // Tüm eşleştirmeleri döngüyle gezerek veri hazırla
      mappings.forEach(mapping => {
        if (mapping.sourceField && mapping.targetField) {
          companyData[mapping.targetField] = flowCompany[mapping.sourceField] || null;
        }
      });

      // Zorunlu alanları kontrol et
      if (!companyData.name) {
        companyData.name = flowCompany.TITLE || 'İsimsiz Firma';
      }

      // Sistem alanlarını ekle
      companyData.is_active = true;
      companyData.is_deleted = false;
      companyData.created_at = 'CURRENT_TIMESTAMP';
      companyData.updated_at = 'CURRENT_TIMESTAMP';
      
      // Flow bilgilerini ekle
      if (!companyData.notes) {
        companyData.notes = `Flow'dan içe aktarıldı. Flow ID: ${flowCompany.ID}`;
      }
      
      if (!companyData.flow_id && flowCompany.ID) {
        companyData.flow_id = flowCompany.ID;
      }
      
      // Dinamik SQL sorgusu oluştur
      const fields = Object.keys(companyData).filter(key => 
        companyData[key] !== null && key !== 'created_at' && key !== 'updated_at'
      );
      
      const placeholders = fields.map((_, index) => `$${index + 1}`);
      const values = fields.map(field => companyData[field]);
      
      const insertQuery = `
        INSERT INTO companies (
          ${fields.join(', ')}, 
          created_at, 
          updated_at
        ) 
        VALUES (
          ${placeholders.join(', ')}, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: insertQuery,
        params: values,
        req
      });

      if (result && result.length > 0) {
        importedCompanies.push(result[0].id);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `${importedCompanies.length} firma başarıyla içe aktarıldı`,
      importedCount: importedCompanies.length,
      importedIds: importedCompanies
    });
  } catch (error: any) {
    console.error('Import flow companies API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Firmalar içe aktarılırken bir hata oluştu',
      details: error.message 
    });
  }
}
