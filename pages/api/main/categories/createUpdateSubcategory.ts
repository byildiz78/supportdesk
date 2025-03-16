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
      categoryId,
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

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
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
      description || null,
      categoryId
    ];

    let query;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      if (isUpdate && id) {
        // Update existing subcategory
        query = `
          UPDATE subcategories
          SET
            name = $1,
            description = $2,
            category_id = $3,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $4
          WHERE id = $5
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
            message: 'Subcategory not found'
          });
        }

        // Format the response
        const subcategory = {
          ...result.rows[0],
          categoryId: result.rows[0].category_id,
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete subcategory.category_id;
        delete subcategory.created_at;
        delete subcategory.created_by;
        delete subcategory.updated_at;
        delete subcategory.updated_by;
        delete subcategory.is_deleted;

        return res.status(200).json({
          success: true,
          message: 'Subcategory updated successfully',
          data: subcategory
        });
      } else {
        // Create new subcategory
        query = `
          INSERT INTO subcategories (
            name,
            description,
            category_id,
            created_at,
            created_by,
            updated_at,
            is_deleted
          )
          VALUES (
            $1, $2, $3,
            CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, false
          )
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.created_by || null
        ]);

        // Format the response
        const subcategory = {
          ...result.rows[0],
          categoryId: result.rows[0].category_id,
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete subcategory.category_id;
        delete subcategory.created_at;
        delete subcategory.created_by;
        delete subcategory.updated_at;
        delete subcategory.updated_by;
        delete subcategory.is_deleted;

        return res.status(201).json({
          success: true,
          message: 'Subcategory created successfully',
          data: subcategory
        });
      }
    });
  } catch (error: any) {
    console.error('Create/Update subcategory API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
