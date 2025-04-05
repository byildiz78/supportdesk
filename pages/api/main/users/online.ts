import { NextApiRequest, NextApiResponse } from 'next';
 import { db } from '@/lib/database';
 
 export default async function handler(
     req: NextApiRequest,
     res: NextApiResponse
 ) {
     if (req.method !== 'GET') {
         return res.status(405).json({ message: 'Method not allowed' });
     }
 
     try {
         const query = `
             SELECT ou.*, u.name as user_name, u.email
             FROM online_users ou
             JOIN users u ON ou.user_id = u.id
             WHERE ou.last_heartbeat > NOW() - INTERVAL '2 minutes'
             ORDER BY ou.last_heartbeat DESC
         `;
 
         const result = await db.executeQuery({
             query,
             params: [],
             req
         });
 
         return res.status(200).json({
             success: true,
             data: result
         });
 
     } catch (error: any) {
         console.error('Online users error:', error);
         return res.status(500).json({
             success: false,
             message: 'Online kullanıcılar alınırken bir hata oluştu',
             details: error.message
         });
     }
 }