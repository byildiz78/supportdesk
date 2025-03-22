import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  lastLogin: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Kullanıcıları getir
    const usersQuery = `
      SELECT 
        id,
        name,
        email,
        role,
        department,
        status,
        last_login as "lastLogin",
        profile_image_url as "profileImageUrl",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy",
        is_deleted as "isDeleted"
      FROM users
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `;

    const usersResult = await db.executeQuery<User[]>({
      query: usersQuery,
      params: [],
      req
    });

    return res.status(200).json({
      success: true,
      data: usersResult
    });
  } catch (error: any) {
    console.error('Get users API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanından kullanıcı bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
