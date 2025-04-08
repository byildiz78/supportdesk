import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Ticket {
  id: string;
  ticketno: number;
  title: string;
  status: string;
  priority: string;
  customer_name: string | null;
  company_name: string | null;
  assigned_user_name: string | null;
  created_at: string;
  updated_at: string | null;
  ticket_created_by_name: string | null;
  category_name: string | null;
  subcategory_name: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { searchTerm } = req.query;
    
    if (!searchTerm || searchTerm === '') {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi gereklidir'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Arama sorgusu - birden fazla alana göre arama yapabilir
    const searchQuery = `
      SELECT 
        t.id,
        t.ticketno,
        t.title,
        t.status,
        t.priority,
        t.customer_name,
        t.company_name,
        u.name as assigned_user_name,
        t.created_at,
        t.updated_at,
        us.name as ticket_created_by_name,
        c.name as category_name,
        s.name as subcategory_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users us ON t.created_by = us.id::VARCHAR
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      WHERE 
        t.is_deleted = false AND
        (
          t.id::text = $2 OR
          t.ticketno::text ILIKE $1 OR
          t.title ILIKE $1 OR
          t.description ILIKE $1 OR
          t.customer_name ILIKE $1 OR
          t.customer_email ILIKE $1 OR
          t.customer_phone ILIKE $1 OR
          t.company_name ILIKE $1 OR
          u.name ILIKE $1 OR
          us.name ILIKE $1 OR
          c.name ILIKE $1 OR
          s.name ILIKE $1
        )
      ORDER BY t.created_at DESC
    `;

    try {
      const searchResult = await db.executeQuery<Ticket[]>({
        query: searchQuery,
        params: [`%${searchTerm}%`, searchTerm],
        req
      });

      return res.status(200).json({
        success: true,
        data: searchResult || [],
        count: searchResult?.length || 0
      });
    } catch (searchError: any) {
      console.error('Arama sorgusu hatası:', searchError);
      return res.status(500).json({
        success: false,
        message: 'Arama yapılırken bir hata oluştu',
        details: searchError.message
      });
    }
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Arama sırasında bir hata oluştu',
      details: error.message
    });
  }
}
