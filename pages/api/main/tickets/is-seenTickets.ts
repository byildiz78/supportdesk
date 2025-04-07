import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

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
    const { id, userId } = req.body;
    
    // id artık tek bir ID veya ID dizisi olabilir
    const ids = Array.isArray(id) ? id : [id];
    
    // Tüm ID'lerin geçerli UUID olduğunu kontrol et
    const invalidIds = ids.filter(ticketId => !isValidUUID(ticketId));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçersiz bilet ID\'leri mevcut' 
      });
    }

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Biletlerin var olup olmadığını kontrol et
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
      const checkQuery = `
        SELECT id FROM tickets WHERE id IN (${placeholders});
      `;
      
      const checkResult = await client.query(checkQuery, ids);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hiçbir bilet bulunamadı' 
        });
      }
      
      // Bulunan biletlerin ID'lerini al
      const foundIds = checkResult.rows.map(row => row.id);
      
      // Biletleri güncelle
      const updateQuery = `
        UPDATE tickets
        SET 
          is_seen = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = ANY($2)
        RETURNING *;
      `;

      const result = await client.query(updateQuery, [
        userId,
        foundIds
      ]);

      const updatedTickets = result.rows;
      
      // Başarılı yanıt döndür
      return res.status(200).json({ 
        success: true, 
        message: `${updatedTickets.length} bilet başarıyla okundu olarak işaretlendi`, 
        data: updatedTickets
      });
    });
  } catch (error: any) {
    console.error('Mark tickets as seen API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}