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
    const { categoryId } = req.query;

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

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // First, soft delete all groups related to this category's subcategories
      const deleteGroupsQuery = `
        UPDATE groups
        SET
          is_deleted = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE subcategory_id IN (
          SELECT id FROM subcategories WHERE category_id = $2
        )
      `;
      
      await client.query(deleteGroupsQuery, [
        req.body.updated_by || null,
        categoryId
      ]);
      
      // Next, soft delete all subcategories related to this category
      const deleteSubcategoriesQuery = `
        UPDATE subcategories
        SET
          is_deleted = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE category_id = $2
      `;
      
      await client.query(deleteSubcategoriesQuery, [
        req.body.updated_by || null,
        categoryId
      ]);
      
      // Finally, soft delete the category
      const deleteCategoryQuery = `
        UPDATE categories
        SET
          is_deleted = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING id;
      `;
      
      const result = await client.query(deleteCategoryQuery, [
        req.body.updated_by || null,
        categoryId
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Category and related items deleted successfully',
        data: { id: result.rows[0].id }
      });
    });
  } catch (error: any) {
    console.error('Delete category API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
