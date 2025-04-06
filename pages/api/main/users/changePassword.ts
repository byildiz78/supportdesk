import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import crypto from 'crypto';

// Login.ts'den kopyalanan encrypt fonksiyonu
function encrypt(val: string): string | null {
  if (!val) {
    return null;
  }
  const buffer = Buffer.from(val, 'utf16le');
  const hash = crypto.createHash('sha256').update(buffer).digest();
  
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join('-');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, password, updated_by } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // Şifreyi encrypt fonksiyonu ile şifrele
      const hashedPassword = encrypt(password);
      
      const query = `
        UPDATE users
        SET
          password_hash = $1,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $3
        RETURNING id, name, email, role, department, status, profile_image_url, last_login, created_at, updated_at, is_deleted;
      `;

      const result = await client.query(query, [
        hashedPassword,
        updated_by || null,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Format the response
      const user = {
        ...result.rows[0],
        lastLogin: result.rows[0].last_login,
        profileImageUrl: result.rows[0].profile_image_url,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        isDeleted: result.rows[0].is_deleted
      };

      // Remove snake_case fields
      delete user.last_login;
      delete user.profile_image_url;
      delete user.created_at;
      delete user.updated_at;
      delete user.is_deleted;

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: user
      });
    });
  } catch (error: any) {
    console.error('Change password API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
