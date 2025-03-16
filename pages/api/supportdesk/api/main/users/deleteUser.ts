import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Soft delete the user
    const query = `
      UPDATE users
      SET
        is_deleted = true,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE id = $2
      RETURNING id;
    `;

    const result = await db.executeQuery<{ id: string }[]>({
      query,
      params: [req.body.updated_by || null, userId],
      req
    });

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id: result[0].id }
    });
  } catch (error: any) {
    console.error('Delete user API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
