import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface MappingField {
  sourceField: string;
  targetField: string;
  description: string;
}

interface FlowCompany {
  [key: string]: any;
}

interface DbResult {
  id: string;
  [key: string]: any;
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

    // Alan eşleştirme ayarlarını getir
    const mappingQuery = `
      SELECT value FROM settings 
      WHERE key = 'flow_company_mapping' AND is_deleted = false
    `;
    
    const mappingResult = await db.executeQuery<{value: string}[]>({
      query: mappingQuery,
      params: [],
      req
    });

    let fieldMappings: MappingField[] = [];
    
    // Eşleştirme ayarları varsa kullan, yoksa varsayılan eşleştirmeyi kullan
    if (mappingResult && mappingResult.length > 0) {
      fieldMappings = JSON.parse(mappingResult[0].value);
    } else {
      // Varsayılan eşleştirme
      fieldMappings = [
        { sourceField: "TITLE", targetField: "name", description: "Firma Adı" },
        { sourceField: "ADDRESS", targetField: "address", description: "Adres" },
        { sourceField: "PHONE", targetField: "phone", description: "Telefon" },
        { sourceField: "EMAIL", targetField: "email", description: "E-posta" },
        { sourceField: "ADDRESS_CITY", targetField: "city", description: "Şehir" },
        { sourceField: "ADDRESS_COUNTRY", targetField: "country", description: "Ülke" }
      ];
    }

    // Eşleştirme tablosunu oluştur
    const mappingTable: Record<string, string> = {};
    fieldMappings.forEach(mapping => {
      if (mapping.sourceField && mapping.targetField) {
        mappingTable[mapping.sourceField] = mapping.targetField;
      }
    });

    // İçe aktarılan firmaları kaydet
    const importedCompanies: string[] = [];
    
    for (const flowCompany of companies) {
      // Eşleştirme tablosunu kullanarak firma verilerini dönüştür
      const companyData: Record<string, any> = {};
      
      // Tüm Flow alanlarını kontrol et ve eşleştirme varsa dönüştür
      Object.keys(flowCompany).forEach(flowField => {
        const targetField = mappingTable[flowField];
        if (targetField) {
          companyData[targetField] = flowCompany[flowField];
        }
      });

      // Firma adı zorunlu alan
      if (!companyData.name) {
        // Eğer eşleştirmede name alanı yoksa, TITLE alanını kullan
        if (flowCompany.TITLE) {
          companyData.name = flowCompany.TITLE;
        } else {
          continue; // Firma adı yoksa, bu firmayı atla
        }
      }

      // Flow'dan içe aktarıldı bilgisini ekle
      companyData.notes = companyData.notes 
        ? `${companyData.notes}\nFlow'dan içe aktarıldı: ${new Date().toLocaleString('tr-TR')}`
        : `Flow'dan içe aktarıldı: ${new Date().toLocaleString('tr-TR')}`;

      // Önce bu isimde firma var mı kontrol et
      const checkQuery = `
        SELECT id FROM companies 
        WHERE name = $1 AND is_deleted = false
      `;
      
      const existingCompany = await db.executeQuery<DbResult[]>({
        query: checkQuery,
        params: [companyData.name],
        req
      });

      // Eğer firma zaten varsa, atla
      if (existingCompany && existingCompany.length > 0) {
        continue;
      }

      // Dinamik sorgu oluştur
      const fields = Object.keys(companyData);
      const placeholders = fields.map((_, index) => `$${index + 1}`);
      
      // Yeni firma ekle
      const insertQuery = `
        INSERT INTO companies (
          ${fields.join(', ')}, 
          created_at, 
          updated_at, 
          is_active,
          is_deleted
        ) 
        VALUES (
          ${placeholders.join(', ')}, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
          true, false
        )
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: insertQuery,
        params: fields.map(field => companyData[field] || null),
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
