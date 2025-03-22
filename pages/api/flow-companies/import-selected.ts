import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { companies, mapping } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçerli firma verisi sağlanmadı' });
    }

    if (!mapping || !mapping.mappings || !Array.isArray(mapping.mappings)) {
      return res.status(400).json({ success: false, message: 'Geçerli eşleştirme verisi sağlanmadı' });
    }

    // Toplu ekleme için gerekli veriler
    const companyDataList: any[] = [];
    const errors: string[] = [];

    // Tarih alanları için kontrol listesi - bu listeyi bir kez tanımlayıp her yerde kullanalım
    const dateFields = ['flow_ba_starting_date', 'flow_ba_end_date', 'start_date', 'end_date'];

    // Eşleştirme kurallarını önce bir map'e dönüştürelim (performans için)
    const mappingRules: Record<string, string> = {};
    for (const map of mapping.mappings) {
      if (map.sourceField && map.targetField) {
        mappingRules[map.sourceField] = map.targetField;
      }
    }

    // Standart veri işleme fonksiyonu - tutarlılık için her yerde bunu kullanalım
    const processFieldValue = (sourceField: string, value: any): any => {
      // Null ve undefined kontrolü
      if (value === undefined || value === null) {
        return null;
      }
      
      // EMAIL alanı için özel işleme
      if (sourceField === 'EMAIL') {
        if (Array.isArray(value) && value.length > 0) {
          return value[0].VALUE || null;
        } else if (typeof value === 'object' && value !== null) {
          return value.VALUE || null;
        }
        return value;
      } 
      
      // PHONE alanı için özel işleme
      if (sourceField === 'PHONE') {
        if (Array.isArray(value) && value.length > 0) {
          return value[0].VALUE || null;
        } else if (typeof value === 'object' && value !== null) {
          return value.VALUE || null;
        }
        return value;
      }
      
      // Array işleme
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        
        return value.map(item => 
          typeof item === 'object' && item !== null ? 
            (item.VALUE !== undefined ? item.VALUE : JSON.stringify(item)) : 
            String(item)
        ).join(', ');
      } 
      
      // Object işleme
      if (typeof value === 'object' && value !== null) {
        if (value.VALUE !== undefined) {
          return value.VALUE;
        }
        return JSON.stringify(value);
      } 
      
      // String ve diğer primitive tipler direkt döner
      return value;
    };

    // Her firma için veri hazırla
    for (const company of companies) {
      try {
        // Eşleştirme kurallarına göre veri hazırla
        const companyData: any = {
          flow_id: company.ID // Flow ID'yi her zaman kaydet
        };

        // Tüm source alanlarını kontrol et
        for (const sourceField in mappingRules) {
          const targetField = mappingRules[sourceField];
          
          // id ve created_at gibi alanları atlıyoruz (bunlar özel alanlar)
          if (targetField === 'id') {
            continue;
          }

          // Eğer kaynak veri varsa veya undefined değilse (null olabilir) işleme al
          if (sourceField in company) {
            // Tutarlı veri işleme için ortak fonksiyonu kullan
            companyData[targetField] = processFieldValue(sourceField, company[sourceField]);
            
            // Tarih alanları için boş string, geçersiz tarih kontrolü
            if (dateFields.includes(targetField) && 
                (companyData[targetField] === '' || 
                 companyData[targetField] === '0000-00-00' || 
                 companyData[targetField] === null)) {
              companyData[targetField] = null;
            }
          }
        }
        
        // En azından bir isim olduğundan emin ol
        if (!companyData.name) {
          companyData.name = company.TITLE || `Flow Firma ${company.ID}`;
        }
        
        // COMPANY_TYPE değeri için özel kontrol
        // Eğer bu alan eksikse ve orijinal objede varsa, onu özel olarak ekleyelim
        if (!companyData.company_type && company.COMPANY_TYPE) {
          companyData.company_type = String(company.COMPANY_TYPE);
        }

        companyDataList.push(companyData);
      } catch (error) {
        console.error(`Error processing company ${company.ID}:`, error);
        errors.push(`Firma ${company.TITLE || company.ID} işlenirken hata: ${(error as Error).message}`);
      }
    }

    if (companyDataList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'İşlenebilecek geçerli firma bulunamadı',
        errors
      });
    }

    // Her bir şirketin flow_id'sini alıp veritabanında var mı yok mu kontrol et
    // Bu şekilde hangi şirketleri güncelleriz, hangilerini ekleriz bileceğiz
    const flowIds = companyDataList.map(company => company.flow_id);
    
    const existingCompaniesQuery = `
      SELECT id, flow_id FROM companies 
      WHERE flow_id = ANY($1) AND is_deleted = false
    `;
    
    const existingCompaniesResult = await db.executeQuery<DbResult[]>({
      query: existingCompaniesQuery,
      params: [flowIds],
      req: req
    });
    
    // Mevcut şirketlerin flow_id'lerini bir Map'e dönüştür
    const existingFlowIds = new Map<string, string>();
    
    if (existingCompaniesResult && existingCompaniesResult.length > 0) {
      existingCompaniesResult.forEach(company => {
        existingFlowIds.set(company.flow_id.toString(), company.id);
      });
    }
    
    // Eklenecek ve güncellenecek şirketleri ayır
    const companiesToInsert: any[] = [];
    const companiesToUpdate: any[] = [];
    
    companyDataList.forEach(company => {
      const flowId = company.flow_id?.toString();
      
      if (flowId && existingFlowIds.has(flowId)) {
        // Mevcut bir şirket, güncelleme listesine ekle
        companiesToUpdate.push({
          ...company,
          id: existingFlowIds.get(flowId)
        });
      } else {
        // Yeni bir şirket, ekleme listesine ekle
        companiesToInsert.push(company);
      }
    });
    
    let totalInserted = 0;
    let totalUpdated = 0;
    
    // EKLEME İŞLEMLERİ
    if (companiesToInsert.length > 0) {
      // Önceki kod ile aynı insert işlemi (batch işleme)
      const batchSize = 50; // Her seferde maksimum 50 firma ekle
      const batches = Math.ceil(companiesToInsert.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, companiesToInsert.length);
        const currentBatch = companiesToInsert.slice(batchStart, batchEnd);
        
        // Bu batch için gerekli olan tüm sütunları belirle
        const allColumns = new Set<string>();
        
        // Önce tüm eşleştirme hedef alanlarını ekle (böylece tüm olası alanlar dahil edilir)
        for (const sourceField in mappingRules) {
          const targetField = mappingRules[sourceField];
          if (targetField !== 'id' && targetField !== 'created_at') {
            allColumns.add(targetField);
          }
        }
        
        // Sonra şirket verilerindeki tüm alanları ekle
        currentBatch.forEach(company => {
          Object.keys(company).forEach(key => {
            allColumns.add(key);
          });
        });
        
        // flow_id ve özel sütunları ekle
        allColumns.add('flow_id');
        allColumns.add('created_at');
        allColumns.add('updated_at');
        allColumns.add('is_deleted');
        allColumns.add('flow_last_update_date');
        
        // Sütunları sırala
        const columns = Array.from(allColumns);
        
        // Değerleri ve placeholderları hazırla
        const batchValues: any[] = [];
        const batchPlaceholders: string[] = [];
        
        for (let i = 0; i < currentBatch.length; i++) {
          const company = currentBatch[i];
          const placeholders: string[] = [];
          let paramIndex = batchValues.length + 1;
          
          for (const col of columns) {
            if (col === 'created_at' || col === 'updated_at' || col === 'flow_last_update_date') {
              placeholders.push('CURRENT_TIMESTAMP');
            } else if (col === 'is_deleted') {
              placeholders.push('false');
            } else {
              // Değeri al ve tarih alanları için kontrol et
              let value = company[col];
              const isDateField = dateFields.includes(col);
              
              // Tarih alanları için geçersiz değer kontrolü
              if (isDateField && (value === '' || value === '0000-00-00' || value === undefined)) {
                value = null;
              }
              
              batchValues.push(value);
              placeholders.push(`$${paramIndex++}`);
            }
          }
          
          batchPlaceholders.push(`(${placeholders.join(', ')})`);
        }
        
        const batchQuery = `
          INSERT INTO companies (${columns.join(', ')}) 
          VALUES ${batchPlaceholders.join(', ')}
          RETURNING id;
        `;
        
        try {
          // Sorguyu çalıştır
          const result = await db.executeQuery<DbResult[]>({
            query: batchQuery,
            params: batchValues,
            req: req
          });
          
          if (result && result.length > 0) {
            totalInserted += result.length;
          }
        } catch (error) {
          console.error(`Error in batch ${batchIndex + 1}:`, error);
          errors.push(`Toplu ekleme hatası (batch ${batchIndex + 1}): ${(error as Error).message}`);
          
          // Hata oluştuğunda sorguyu ve parametreleri loglayalım
          console.error('Failed query:', batchQuery);
          console.error('Query params count:', batchValues.length);
          console.error('First few params:', batchValues.slice(0, 5));
        }
      }
    }
    
    // GÜNCELLEME İŞLEMLERİ
    if (companiesToUpdate.length > 0) {
      const batchSize = 50; // Her seferde maksimum 50 firma güncelle
      const batches = Math.ceil(companiesToUpdate.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, companiesToUpdate.length);
        const currentBatch = companiesToUpdate.slice(batchStart, batchEnd);
        
        for (const company of currentBatch) {
          try {
            // id, flow_id dışındaki tüm alanları güncelle
            const updateFields: string[] = [];
            const updateValues: any[] = [];
            let paramIndex = 1;
            
            for (const [key, value] of Object.entries(company)) {
              // id ve flow_id güncellenmez
              if (key === 'id' || key === 'flow_id') {
                continue;
              }
              
              updateFields.push(`${key} = $${paramIndex++}`);
              
              // Tarih alanları için geçersiz değer kontrolü
              const isDateField = dateFields.includes(key);
              
              // Eğer tarih alanı ve değer geçersizse null kullan
              if (isDateField && (value === '' || value === '0000-00-00' || value === null)) {
                updateValues.push(null);
              } else {
                updateValues.push(value);
              }
            }
            
            // Güncelleme zamanı ve flow son güncelleme tarihini ekle
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateFields.push(`flow_last_update_date = CURRENT_TIMESTAMP`);
            
            if (updateFields.length === 0) {
              continue; // Güncellenecek alan yoksa atla
            }
            
            // ID ve değerleri ekle
            updateValues.push(company.id);
            
            const updateQuery = `
              UPDATE companies
              SET ${updateFields.join(', ')}
              WHERE id = $${paramIndex}
              RETURNING id;
            `;
            
            const result = await db.executeQuery<DbResult[]>({
              query: updateQuery,
              params: updateValues,
              req: req
            });
            
            if (result && result.length > 0) {
              totalUpdated += result.length;
            }
          } catch (error) {
            console.error(`Error updating company ${company.id}:`, error);
            errors.push(`Firma ${company.name || company.flow_id} güncellenirken hata: ${(error as Error).message}`);
          }
        }
      }
    }

    // Flow verilerinin içe aktarıldığını işaretle
    if (totalInserted > 0 || totalUpdated > 0) {
      try {
        // Veritabanına aktarıldığını belirtmek için işaretleme yapabilirsiniz (opsiyonel)
        // Burada ekstra bir işlem yapılabilir
      } catch (error) {
        console.error('Error marking companies as imported:', error);
      }
    }

    return res.status(200).json({
      success: true,
      inserted: totalInserted,
      updated: totalUpdated,
      failed: companies.length - (totalInserted + totalUpdated),
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing companies:', error);
    return res.status(500).json({
      success: false,
      message: 'Firmalar içe aktarılırken bir hata oluştu',
      error: (error as Error).message
    });
  }
}