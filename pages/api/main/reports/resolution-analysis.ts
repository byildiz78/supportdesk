import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { date1, date2 } = req.body;

        if (!date1 || !date2) {
            return res.status(400).json({ message: 'Date range is required' });
        }

        // Tenant ID'yi req.body içine ekle
        req.body = {
            ...req.body,
            tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
        };

        // Tenant ID filtresi kaldırıldı
        const tenantFilter = '';

        // Çözüm analizi için SQL sorgusu
        const resolutionAnalysisQuery = `
            SELECT 
                t.id,
                t.ticketno as "TicketNo",
                t.title as "Subject",
                t.status as "Status",
                t.created_at as "CreatedAt",
                t.priority as "Priority",
                t.resolution_time as "resolved_at",
                COALESCE(u.name, 'Atanmamış') as "assigned_to_name",
                CASE 
                    WHEN t.resolution_time IS NOT NULL THEN 
                        ROUND(EXTRACT(EPOCH FROM (t.resolution_time - t.created_at))/60)::integer
                    ELSE 
                        NULL
                END as "elapsed_time",
                t.resolution_notes as "resolution_notes",
                t.company_name as "company_name"
            FROM 
                tickets t
            LEFT JOIN 
                users u ON t.assigned_to = u.id
            WHERE 
                (t.is_deleted = false OR t.is_deleted IS NULL)
                AND t.status = 'resolved'
                AND t.created_at >= $1 AND t.created_at <= $2
                ${tenantFilter}
            ORDER BY 
                "elapsed_time" ASC
        `;

        // Sorguyu çalıştır
        const resolutionAnalysisResult = await db.executeQuery<any[]>({ 
            query: resolutionAnalysisQuery, 
            params: [date1, date2], 
            req 
        });

        // Sonuçları döndür
        return res.status(200).json(resolutionAnalysisResult);
    } catch (error: any) {
        console.error('Error fetching resolution analysis data:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Veritabanından çözüm analizi verileri alınırken bir hata oluştu', 
            details: error.message 
        });
    }
}
