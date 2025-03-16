import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      name,
      email,
      role,
      department,
      status,
      profileImageUrl,
      flowID,
      isUpdate,
      ...otherFields
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Prepare database query parameters
    const params = [
      name,
      email,
      role,
      department || null,
      status || 'active',
      profileImageUrl || null
    ];

    let query;
    let userId;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      if (isUpdate && id) {
        // Update existing user
        userId = id;
        query = `
          UPDATE users
          SET
            name = $1,
            email = $2,
            role = $3,
            department = $4,
            status = $5,
            profile_image_url = $6,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $7
          WHERE id = $8
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.updated_by || null,
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
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete user.last_login;
        delete user.profile_image_url;
        delete user.created_at;
        delete user.created_by;
        delete user.updated_at;
        delete user.updated_by;
        delete user.is_deleted;

        return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: user
        });
      } else {
        // Create new user
        query = `
          INSERT INTO users (
            name,
            email,
            role,
            department,
            status,
            profile_image_url,
            created_at,
            created_by,
            updated_at,
            is_deleted
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            CURRENT_TIMESTAMP, $7, CURRENT_TIMESTAMP, false
          )
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.created_by || null
        ]);

        // Format the response
        const user = {
          ...result.rows[0],
          lastLogin: result.rows[0].last_login,
          profileImageUrl: result.rows[0].profile_image_url,
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete user.last_login;
        delete user.profile_image_url;
        delete user.created_at;
        delete user.created_by;
        delete user.updated_at;
        delete user.updated_by;
        delete user.is_deleted;

        return res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: user
        });
      }
    });
  } catch (error: any) {
    console.error('Create/Update user API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
