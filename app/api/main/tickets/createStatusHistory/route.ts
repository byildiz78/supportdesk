import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const body = await request.json();

    // Gerekli alanları kontrol et
    if (!body.ticket_id || !body.new_status || !body.changed_by) {
      return NextResponse.json({ 
        success: false, 
        message: 'Eksik bilgi: ticket_id, new_status ve changed_by zorunlu alanlardır' 
      }, { status: 400 });
    }

    // Tenant ID'yi URL'den çıkar
    const url = request.url;
    const tenantIdMatch = url.match(/\/\[tenantId\]\/([^\/]+)/);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : undefined;

    if (!tenantId) {
      console.warn('Tenant ID could not be extracted from URL');
    }

    // Atanan kişi değişikliği mi kontrol et
    const isAssignmentChange = body.is_assignment_change === true;

    // Eğer önceki durum değişikliği varsa, o durumda geçirilen süreyi hesapla
    let timeInStatus = null;
    if (body.previous_status && !isAssignmentChange) {
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

    // Durum değişikliği kaydını oluştur
    const result = await executeQuery<any[]>({
      query: `
        INSERT INTO ticket_status_history 
        (ticket_id, previous_status, new_status, changed_by, time_in_status, is_assignment_change) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `,
      params: [
        body.ticket_id,
        body.previous_status || null,
        body.new_status,
        body.changed_by,
        timeInStatus,
        isAssignmentChange || false
      ],
      tenantId
    });

    // Başarılı yanıt döndür
    return NextResponse.json({ 
      success: true, 
      message: 'Durum değişikliği kaydı başarıyla oluşturuldu', 
      data: result && result.length > 0 ? result[0] : null 
    });
  } catch (error: any) {
    console.error('Durum değişikliği kaydı oluşturulurken hata:', error);
    
    // Hata yanıtı döndür
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Durum değişikliği kaydı oluşturulurken bir hata oluştu' 
    }, { status: 500 });
  }
}
