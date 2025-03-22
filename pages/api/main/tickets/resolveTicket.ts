import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

// UUID formatini dogrulama fonksiyonu
const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, resolution_notes, resolved_by, tags } = req.body;
    
    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli bir bilet ID\'si gerekli' 
      });
    }

    if (!resolution_notes || resolution_notes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Çözüm detayları gereklidir'
      });
    }

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Sadece çözüm detaylarını ve durumu güncelle
      const updateQuery = `
        UPDATE tickets
        SET 
          status = 'resolved',
          resolution_notes = $1,
          resolved_by = $2,
          resolution_time = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE id = $4
        RETURNING *;
      `;

      const result = await client.query(updateQuery, [
        resolution_notes,
        isValidUUID(resolved_by) ? resolved_by : null,
        resolved_by, // updated_by için de resolved_by kullanılıyor
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bilet bulunamadı' 
        });
      }

      let updatedTicket = result.rows[0];
      
      // Etiketleri güncelle (eğer varsa)
      if (tags && Array.isArray(tags) && tags.length > 0) {
        try {
          // Önce mevcut etiketleri temizle
          await client.query(
            `DELETE FROM ticket_tags WHERE ticket_id = $1`,
            [id]
          );
          
          // Yeni etiketleri ekle
          for (const tag of tags) {
            // Önce tag_id'yi bul
            const tagQuery = `SELECT id FROM tags WHERE name = $1 AND is_deleted = false`;
            const tagResult = await client.query(tagQuery, [tag]);
            
            if (tagResult.rows.length > 0) {
              const tagId = tagResult.rows[0].id;
              // Etiket bulundu, şimdi ekle
              await client.query(
                `INSERT INTO ticket_tags (ticket_id, tag_id) VALUES ($1, $2)`,
                [id, tagId]
              );
            }
          }
          
          // Etiketleri sonuç nesnesine ekle
          updatedTicket.tags = tags;
        } catch (error) {
          console.error('Etiketler güncellenirken hata oluştu:', error);
          // Hata olsa bile işlemi devam ettir
        }
      }

      // Başarılı yanıt döndür
      return res.status(200).json({ 
        success: true, 
        message: 'Bilet başarıyla çözümlendi', 
        data: updatedTicket
      });
    });
  } catch (error: any) {
    console.error('Resolve ticket API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}
