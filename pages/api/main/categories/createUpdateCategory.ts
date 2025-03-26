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
      description,
      isUpdate,
      userId,
      ...otherFields
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
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
      description || null
    ];

    let query;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      if (isUpdate && id) {
        // Update existing category
        query = `
          UPDATE categories
          SET
            name = $1,
            description = $2,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $3
          WHERE id = $4
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          userId || req.body.updated_by || null,
          id
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }

        // Format the response
        const category = {
          ...result.rows[0],
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete category.created_at;
        delete category.created_by;
        delete category.updated_at;
        delete category.updated_by;
        delete category.is_deleted;

        return res.status(200).json({
          success: true,
          message: 'Category updated successfully',
          data: category
        });
      } else {
        // Create new category
        query = `
          INSERT INTO categories (
            name,
            description,
            created_at,
            created_by,
            updated_at,
            is_deleted
          )
          VALUES (
            $1, $2,
            CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, false
          )
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          userId || req.body.created_by || null
        ]);

        // Format the response
        const category = {
          ...result.rows[0],
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete category.created_at;
        delete category.created_by;
        delete category.updated_at;
        delete category.updated_by;
        delete category.is_deleted;

        return res.status(201).json({
          success: true,
          message: 'Category created successfully',
          data: category
        });
      }
    });
  } catch (error: any) {
    console.error('Create/Update category API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
