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
    const { subcategoryId } = req.query;

    if (!subcategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      // First, soft delete all groups related to this subcategory
      const deleteGroupsQuery = `
        UPDATE groups
        SET
          is_deleted = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE subcategory_id = $2
      `;
      
      await client.query(deleteGroupsQuery, [
        req.body.updated_by || null,
        subcategoryId
      ]);
      
      // Then, soft delete the subcategory
      const deleteSubcategoryQuery = `
        UPDATE subcategories
        SET
          is_deleted = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING id;
      `;
      
      const result = await client.query(deleteSubcategoryQuery, [
        req.body.updated_by || null,
        subcategoryId
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Subcategory and related groups deleted successfully',
        data: { id: result.rows[0].id }
      });
    });
  } catch (error: any) {
    console.error('Delete subcategory API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
