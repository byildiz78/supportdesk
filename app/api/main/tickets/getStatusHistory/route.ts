import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    // URL'den ticket_id parametresini al
    const url = new URL(request.url);
    const ticketId = url.searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Eksik parametre: ticketId gereklidir' 
      }, { status: 400 });
    }

    // Tenant ID'yi URL'den çıkar
    const tenantIdMatch = url.pathname.match(/\/\[tenantId\]\/([^\/]+)/);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : undefined;

    if (!tenantId) {
      console.warn('Tenant ID could not be extracted from URL');
    }

    // Durum geçmişi kayıtlarını getir
    const result = await executeQuery<any[]>({
      query: `
        SELECT 
          tsh.*, 
          u.name as changed_by_name,
          tsh.changed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul' as changed_at_local,
          -- Kategori bilgileri
          c1.name as previous_category_name,
          c2.name as new_category_name,
          -- Alt kategori bilgileri
          sc1.name as previous_subcategory_name,
          sc2.name as new_subcategory_name,
          -- Grup bilgileri
          g1.name as previous_group_name,
          g2.name as new_group_name
        FROM ticket_status_history tsh
        LEFT JOIN users u ON tsh.changed_by = u.id
        -- Kategori bilgisi için join
        LEFT JOIN categories c1 ON tsh.previous_category_id = c1.id
        LEFT JOIN categories c2 ON tsh.new_category_id = c2.id
        -- Alt kategori bilgisi için join
        LEFT JOIN subcategories sc1 ON tsh.previous_subcategory_id = sc1.id
        LEFT JOIN subcategories sc2 ON tsh.new_subcategory_id = sc2.id
        -- Grup bilgisi için join
        LEFT JOIN groups g1 ON tsh.previous_group_id = g1.id
        LEFT JOIN groups g2 ON tsh.new_group_id = g2.id
        WHERE tsh.ticket_id = $1
        ORDER BY tsh.changed_at DESC
      `,
      params: [ticketId],
      tenantId
    });

    // Başarılı yanıt döndür
    return NextResponse.json({ 
      success: true, 
      data: result || []
    });
  } catch (error: any) {
    console.error('Durum geçmişi alınırken hata:', error);
    
    // Hata yanıtı döndür
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Durum geçmişi alınırken bir hata oluştu' 
    }, { status: 500 });
  }
}
