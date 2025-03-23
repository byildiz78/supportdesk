import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const body = await request.json();

    // Gerekli alanları kontrol et
    if (!body.entity_type || !body.entity_id || !body.action) {
      return NextResponse.json({ 
        success: false, 
        message: 'Eksik bilgi: entity_type, entity_id ve action zorunlu alanlardır' 
      }, { status: 400 });
    }

    // IP adresi ve user agent bilgilerini al
    let ip_address = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // IP adresini kısalt (50 karakterden uzunsa)
    if (ip_address.length > 45) {
      // Birden fazla IP varsa ilkini al
      if (ip_address.includes(',')) {
        ip_address = ip_address.split(',')[0].trim();
      }
      // Hala uzunsa kes
      if (ip_address.length > 45) {
        ip_address = ip_address.substring(0, 45);
      }
    }
    
    // User agent'ı kısalt
    const user_agent = (request.headers.get('user-agent') || 'unknown').substring(0, 255);

    // Tenant ID'yi URL'den çıkar
    const url = request.url;
    const tenantIdMatch = url.match(/\/\[tenantId\]\/([^\/]+)/);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : undefined;

    if (!tenantId) {
      console.warn('Tenant ID could not be extracted from URL');
    }

    // Audit log kaydını oluştur
    const result = await executeQuery<any[]>({
      query: `
        INSERT INTO audit_logs 
        (user_id, entity_type, entity_id, action, previous_state, new_state, ip_address, user_agent) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `,
      params: [
        body.user_id || null,
        body.entity_type,
        body.entity_id,
        body.action,
        body.previous_state ? JSON.stringify(body.previous_state) : null,
        body.new_state ? JSON.stringify(body.new_state) : null,
        ip_address,
        user_agent
      ],
      tenantId
    });

    // Başarılı yanıt döndür
    return NextResponse.json({ 
      success: true, 
      message: 'Audit log başarıyla oluşturuldu', 
      data: result && result.length > 0 ? result[0] : null 
    });
  } catch (error: any) {
    console.error('Audit log oluşturulurken hata:', error);
    
    // Hata yanıtı döndür
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Audit log oluşturulurken bir hata oluştu' 
    }, { status: 500 });
  }
}
