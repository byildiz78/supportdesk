import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const body = await request.json();

    // Gerekli alanları kontrol et
    if (!body.ticket_id || !body.changed_by) {
      return NextResponse.json({ 
        success: false, 
        message: 'Eksik bilgi: ticket_id ve changed_by zorunlu alanlardır' 
      }, { status: 400 });
    }

    // Tenant ID'yi URL'den çıkar
    const url = request.url;
    const tenantIdMatch = url.match(/\/\[tenantId\]\/([^\/]+)/);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : undefined;

    if (!tenantId) {
      console.warn('Tenant ID could not be extracted from URL');
    }

    // Değişiklik tipini kontrol et
    const isAssignmentChange = body.is_assignment_change === true;
    const isCategoryChange = body.is_category_change === true;

    // Eğer önceki durum değişikliği varsa, o durumda geçirilen süreyi hesapla
    let timeInStatus = null;
    if (body.previous_status && !isAssignmentChange && !isCategoryChange) {
      try {
        // Önceki durum değişikliğinin zamanını bul
        const previousStatusEntry = await executeQuery<any[]>({
          query: `
            SELECT changed_at
            FROM ticket_status_history 
            WHERE ticket_id = $1 
            AND new_status = $2 
            ORDER BY changed_at DESC 
            LIMIT 1
          `,
          params: [body.ticket_id, body.previous_status],
          tenantId
        });

        if (previousStatusEntry && previousStatusEntry.length > 0) {
          const previousChangeTime = new Date(previousStatusEntry[0].changed_at);
          const currentTime = new Date();
          
          // Saniye cinsinden süreyi hesapla
          timeInStatus = Math.floor((currentTime.getTime() - previousChangeTime.getTime()) / 1000);
        }
      } catch (timeError) {
        console.error("Durum süresi hesaplanırken hata:", timeError);
        // Süre hesaplama hatası kayıt oluşturmayı engellemeyecek
      }
    }

    let query = '';
    let params = [];

    if (isCategoryChange) {
      // Kategori değişikliği kaydını oluştur
      query = `
        INSERT INTO ticket_status_history 
        (ticket_id, changed_by, is_category_change, 
        previous_category_id, new_category_id,
        previous_subcategory_id, new_subcategory_id,
        previous_group_id, new_group_id, new_status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `;
      params = [
        body.ticket_id,
        body.changed_by,
        true,
        body.previous_category_id || null,
        body.new_category_id || null,
        body.previous_subcategory_id || null,
        body.new_subcategory_id || null,
        body.previous_group_id || null,
        body.new_group_id || null,
        body.new_status || 'unchanged'
      ];
    } else {
      // Durum değişikliği veya atama değişikliği kaydını oluştur
      query = `
        INSERT INTO ticket_status_history 
        (ticket_id, previous_status, new_status, changed_by, time_in_status, is_assignment_change) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      params = [
        body.ticket_id,
        body.previous_status || null,
        body.new_status,
        body.changed_by,
        timeInStatus,
        isAssignmentChange || false
      ];
    }

    // Kayıt oluştur
    const result = await executeQuery<any[]>({
      query,
      params,
      tenantId
    });

    // Başarılı yanıt döndür
    return NextResponse.json({ 
      success: true, 
      message: 'Değişiklik kaydı başarıyla oluşturuldu', 
      data: result && result.length > 0 ? result[0] : null 
    });
  } catch (error: any) {
    console.error('Değişiklik kaydı oluşturulurken hata:', error);
    
    // Hata yanıtı döndür
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Değişiklik kaydı oluşturulurken bir hata oluştu' 
    }, { status: 500 });
  }
}
