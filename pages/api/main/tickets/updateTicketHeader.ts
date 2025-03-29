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
    const { title, description, updated_by, id } = req.body;
    
    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli bir bilet ID\'si gerekli' 
      });
    }

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Sadece title ve description bilgilerini güncelle
      const updateQuery = `
        UPDATE tickets
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = COALESCE($3, updated_by)
        WHERE id = $4;
      `;

      await client.query(updateQuery, [
        title,
        description,
        updated_by,
        id
      ]);

      // Güncellenen bileti tüm ilişkili verilerle birlikte getir
      const selectQuery = `
      SELECT 
        t.id,
        t.ticketno,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.source,
        t.category_id,
        c.name as category_name,
        t.subcategory_id,
        s.name as subcategory_name,
        t.group_id,
        g.name as group_name,
        t.customer_name,
        t.customer_email,
        t.customer_phone,
        t.company_id,
        t.company_name,
        t.contact_id,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        CONCAT(ct.first_name, ' ', ct.last_name) as contact_name,
        ct.email as contact_email,
        ct.phone as contact_phone,
        ct.position as contact_position,
        t.assigned_to,
        u.name as assigned_user_name,
        t.due_date,
        t.resolution_time,
        t.created_at,
        t.created_by,
        t.updated_at,
        t.updated_by,
        us.name as ticket_created_by_name,
        t.is_deleted,
        t.parent_company_id,
        t.sla_breach,
        t.resolution_time,
        t.resolution_notes
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON s.id = t.subcategory_id
      LEFT JOIN groups g ON g.id = t.group_id
      LEFT JOIN contacts ct ON t.contact_id = ct.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users us ON t.created_by = us.id::VARCHAR
      WHERE t.id = $1::uuid
      `;

      const result = await client.query(selectQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bilet bulunamadı' 
        });
      }

      // Başarılı yanıt döndür
      return res.status(200).json({ 
        success: true, 
        message: 'Bilet başlığı ve açıklaması başarıyla güncellendi', 
        data: result.rows[0]
      });

    });
  } catch (error: any) {
    console.error('Update ticket header API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}