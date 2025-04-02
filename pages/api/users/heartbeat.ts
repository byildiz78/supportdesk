import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface HeartbeatRequest {
    user_id: string;
    status: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
        const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || 'public';
        console.log('Heartbeat request:', { body: req.body, tenantId });

        req.body = {
            ...req.body,
            tenantId
        };

        const { user_id, status } = req.body as HeartbeatRequest;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id gerekli'
            });
        }

        // Kullanıcı bilgilerini al
        const userQuery = `
            SELECT role, department
            FROM users
            WHERE id = $1 AND is_deleted = false
        `;

        console.log('Executing user query:', { user_id });
        const userResult = await db.executeQuery<{ role: string; department: string }[]>({
            query: userQuery,
            params: [user_id],
            req
        });

        if (!userResult || userResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        const { role, department } = userResult[0];
        console.log('User found:', { role, department });

        // Online users tablosunu güncelle
        const query = `
            INSERT INTO online_users (user_id, status, last_heartbeat, role, department)
            VALUES ($1, $2, NOW(), $3, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET
                status = $2,
                last_heartbeat = NOW(),
                role = $3,
                department = $4
            RETURNING id, user_id, status, last_heartbeat
        `;

        console.log('Executing online_users query:', { user_id, status, role, department });
        const result = await db.executeQuery<{ id: number; user_id: string; status: string; last_heartbeat: Date }[]>({
            query,
            params: [user_id, status, role, department],
            req
        });

        if (!result || result.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Heartbeat güncellenirken bir hata oluştu'
            });
        }

        console.log('Heartbeat updated:', result[0]);
        return res.status(200).json({
            success: true,
            data: result[0]
        });

    } catch (error: any) {
        console.error('Heartbeat error:', error);
        return res.status(500).json({
            success: false,
            message: 'Heartbeat güncellenirken bir hata oluştu',
            details: error.message,
            query: error.query,
            params: error.params
        });
    }
}
