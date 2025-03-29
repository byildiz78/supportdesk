import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { Ticket } from '@/types/tickets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // userId'yi request body'den al
    const { userId, hours = 24 } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Kullanıcı ID gerekli' });
    }
    
    // Son belirli saat içinde kullanıcıya atanan biletleri getir
    // Users tablosu ile join yaparak kullanıcı bilgilerini de al
    const query = `
      SELECT 
        t.id, 
        t.ticketno, 
        t.title, 
        t.status, 
        t.priority,
        t.assigned_to,
        t.created_at,
        t.customer_name,
        t.company_name,
        u.name as assigned_user_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
        AND t.created_at > NOW() - INTERVAL '${hours} hours'
        AND (t.is_deleted = false OR t.is_deleted IS NULL)
      ORDER BY t.created_at DESC
    `;

    const result = await db.executeQuery<Ticket[]>({
      query,
      params: [userId],
      req
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Atanan biletler alınırken hata oluştu:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
}
