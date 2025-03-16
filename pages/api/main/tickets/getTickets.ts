import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  source: string | null;
  category_id: string | null;
  category_name: string | null;
  subcategory_id: string | null;
  group_id: string | null;
  assigned_to: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  company_name: string | null;
  company_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_position: string | null;
  due_date: string | null;
  resolution_time: number | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  parent_company_id: string | null;
  sla_breach: boolean | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Biletler API çağrıldı');

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.source,
        t.category_id,
        c.name as category_name,
        t.subcategory_id,
        t.group_id,
        t.assigned_to,
        t.customer_name,
        t.customer_email,
        t.customer_phone,
        t.company_id,
        t.company_name,
        t.contact_id,
        CONCAT(ct.first_name, ' ', ct.last_name) as contact_name,
        ct.email as contact_email,
        t.contact_position,
        t.due_date,
        t.resolution_time,
        t.created_at,
        t.created_by,
        t.updated_at,
        t.updated_by,
        t.is_deleted,
        t.parent_company_id,
        t.sla_breach
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN contacts ct ON t.contact_id = ct.id
      WHERE t.is_deleted = false
      ORDER BY t.created_at DESC
    `;

    console.log('Biletler sorgusu çalıştırılıyor:', query);

    try {
      const result = await db.executeQuery<Ticket[]>({
        query,
        params: [],
        req
      });
      
      console.log('Biletler sorgu sonucu:', result ? result.length : 0);
      
      // Kişi bilgilerini kontrol et ve eksikse tamamla
      if (result && result.length > 0) {
        const ticketsWithContactIds = result.filter(ticket => 
          ticket.contact_id && (!ticket.contact_name || !ticket.contact_email)
        );
        
        if (ticketsWithContactIds.length > 0) {
          console.log('Bazı biletlerde kişi bilgileri eksik, contacts tablosundan sorgulanıyor...');
          
          // Tüm eksik contact_id'leri topla
          const contactIds = Array.from(new Set(ticketsWithContactIds.map(t => t.contact_id).filter(Boolean) as string[]));
          
          if (contactIds.length > 0) {
            const contactQuery = `
              SELECT 
                id,
                CONCAT(first_name, ' ', last_name) as contact_name,
                email as contact_email,
                phone as contact_phone,
                position as contact_position
              FROM contacts
              WHERE id = ANY($1::uuid[])
            `;
            
            try {
              const contactsResult = await db.executeQuery<any[]>({
                query: contactQuery,
                params: [contactIds],
                req
              });
              
              if (contactsResult && contactsResult.length > 0) {
                // Kişi bilgilerini eşleştir ve biletlere ekle
                const contactsMap = new Map();
                contactsResult.forEach(contact => {
                  contactsMap.set(contact.id, contact);
                });
                
                result.forEach(ticket => {
                  if (ticket.contact_id && contactsMap.has(ticket.contact_id)) {
                    const contact = contactsMap.get(ticket.contact_id);
                    ticket.contact_name = contact.contact_name;
                    ticket.contact_email = contact.contact_email;
                    ticket.contact_phone = contact.contact_phone;
                    ticket.contact_position = contact.contact_position;
                  }
                });
              }
            } catch (contactError) {
              console.error('Kişiler sorgusu hatası:', contactError);
            }
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        data: result || []
      });
    } catch (queryError: any) {
      console.error('Biletler sorgusu hatası:', queryError);
      return res.status(500).json({
        success: false,
        message: 'Bilet bilgileri alınamadı',
        details: queryError.message
      });
    }
  } catch (error: any) {
    console.error('Get tickets API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından bilet bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
