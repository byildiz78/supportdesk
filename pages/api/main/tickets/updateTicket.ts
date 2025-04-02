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
    const { id, ...ticketData } = req.body;
    const tenantId = extractTenantFromBody(req);
    
    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gecerli bir bilet ID\'si gerekli' 
      });
    }

    // UUID alanlarini dogrula
    const safeTicketData = {
      ...ticketData,
      assigned_to: isValidUUID(ticketData.assigned_to) ? ticketData.assigned_to : null,
      company_id: isValidUUID(ticketData.company_id) ? ticketData.company_id : null,
      contact_id: isValidUUID(ticketData.contact_id) ? ticketData.contact_id : null,
      category_id: isValidUUID(ticketData.category_id) ? ticketData.category_id : null,
      subcategory_id: isValidUUID(ticketData.subcategory_id) ? ticketData.subcategory_id : null,
      group_id: isValidUUID(ticketData.group_id) ? ticketData.group_id : null,
      // Status ve priority alanlarını güvenli bir şekilde işle
      status: ['open', 'in_progress', 'waiting', 'pending', 'resolved', 'closed'].includes(ticketData.status) ? ticketData.status : null,
      priority: ['low', 'medium', 'high', 'urgent'].includes(ticketData.priority) ? ticketData.priority : null
    };

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Contact işlemlerini yap
      let contactId: string | null = safeTicketData.contact_id;
      
      // Telefon numarası veya email varsa, contacts tablosunda kontrol et
      if (safeTicketData.customer_phone || safeTicketData.customer_email) {
        try {
          // Önce telefon numarası veya email ile kişiyi ara
          const checkContactQuery = `
            SELECT id FROM contacts 
            WHERE (mobile = $1 OR email = $2)
            AND (is_deleted = false OR is_deleted IS NULL)
          `;
          
          const contactResult = await client.query(checkContactQuery, [
            safeTicketData.customer_phone || '',
            safeTicketData.customer_email || ''
          ]);
          
          if (contactResult.rows.length > 0) {
            // Kişi bulundu, ID'sini al ve güncelle
            contactId = contactResult.rows[0].id;
            
            // Kişiyi güncelle
            const updateContactQuery = `
              UPDATE contacts
              SET 
                first_name = CASE WHEN $1 != '' THEN SPLIT_PART($1, ' ', 1) ELSE first_name END,
                last_name = CASE WHEN $1 != '' THEN SPLIT_PART($1, ' ', 2) ELSE last_name END,
                email = COALESCE($2, email),
                mobile = COALESCE($3, mobile),
                position = COALESCE($4, position),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $5
              RETURNING id, first_name, last_name, email
            `;
            
            const updateResult = await client.query(updateContactQuery, [
              safeTicketData.customer_name || '',
              safeTicketData.customer_email,
              safeTicketData.customer_phone,
              safeTicketData.contact_position,
              contactId
            ]);
          } else if (safeTicketData.customer_name) {
            // Kişi bulunamadı ve isim veya email varsa yeni kişi oluştur
            const createContactQuery = `
              INSERT INTO contacts (
                first_name,
                last_name,
                email,
                mobile,
                position,
                created_at,
                updated_at,
                is_deleted
              )
              VALUES (
                SPLIT_PART($1, ' ', 1),
                SPLIT_PART($1, ' ', 2),
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                false
              )
              RETURNING id, first_name, last_name, email
            `;
            const newContactResult = await client.query(createContactQuery, [
              safeTicketData.customer_name || '',
              safeTicketData.customer_email,
              safeTicketData.customer_phone,
              safeTicketData.contact_position
            ]);
            
            if (newContactResult.rows.length > 0) {
              contactId = newContactResult.rows[0].id;
            }
          }
        } catch (contactError) {
          console.error('Error in contact processing:', contactError);
          // Hata olsa bile işleme devam et, sadece contact_id null olacak
        }
      }

      // Sadece sidebar verilerini ve title-description bilgilerini guncelle
      const updateQuery = `
        UPDATE tickets
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          priority = COALESCE($4, priority),
          assigned_to = $5,
          customer_name = COALESCE($6, customer_name),
          customer_email = COALESCE($7, customer_email),
          customer_phone = COALESCE($8, customer_phone),
          company_name = $9,
          company_id = $10,
          contact_position = COALESCE($11, contact_position),
          contact_id = $12,
          category_id = $13,
          subcategory_id = $14,
          group_id = $15,
          due_date = $16,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = COALESCE($17, updated_by)
        WHERE id = $18
        RETURNING *;
      `;

      // company_id null ise company_name'i de null yap
      const companyName = safeTicketData.company_id === null ? null : safeTicketData.company_name;

      const result = await client.query(updateQuery, [
        safeTicketData.title,
        safeTicketData.description,
        safeTicketData.status,
        safeTicketData.priority,
        safeTicketData.assigned_to,
        safeTicketData.customer_name,
        safeTicketData.customer_email,
        safeTicketData.customer_phone,
        companyName,
        safeTicketData.company_id,
        safeTicketData.contact_position,
        contactId, // Güncellenmiş veya yeni oluşturulmuş contact_id kullan
        safeTicketData.category_id,
        safeTicketData.subcategory_id,
        safeTicketData.group_id,
        safeTicketData.due_date,
        safeTicketData.updated_by,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bilet bulunamadi' 
        });
      }

      // Atanan kullanıcı adını almak için ek sorgu
      let updatedTicket = result.rows[0];
      
      if (updatedTicket.assigned_to) {
        try {
          const userQuery = `
            SELECT name FROM users WHERE id = $1
          `;
          const userResult = await client.query(userQuery, [updatedTicket.assigned_to]);
          
          if (userResult.rows.length > 0) {
            updatedTicket.assigned_user_name = userResult.rows[0].name;
          }
        } catch (error) {
          console.error('Atanan kullanıcı bilgisi alınamadı:', error);
          // Hata olsa bile işlemi devam ettir
        }
      }

      // Basarili yanit dondur
      return res.status(200).json({ 
        success: true, 
        message: 'Bilet basariyla guncellendi', 
        data: updatedTicket
      });
    });
  } catch (error: any) {
    console.error('Update ticket API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatasi',
      details: error.message 
    });
  }
}