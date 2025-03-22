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
      subcategoryId,
      mesai_saatleri_sla,
      mesai_disi_sla,
      hafta_sonu_mesai_sla,
      hafta_sonu_mesai_disi_sla,
      sla_next_day_start,
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

    // Prepare database query parameters
    const params = [
      name,
      description || null,
      subcategoryId,
      mesai_saatleri_sla || 60,
      mesai_disi_sla || 120,
      hafta_sonu_mesai_sla || 180,
      hafta_sonu_mesai_disi_sla || 240,
      sla_next_day_start || false
    ];

    let query;

    // Use a transaction to ensure data consistency
    return await db.executeTransaction(req, async (client) => {
      if (isUpdate && id) {
        // Update existing group
        query = `
          UPDATE groups
          SET
            name = $1,
            description = $2,
            subcategory_id = $3,
            mesai_saatleri_sla = $4,
            mesai_disi_sla = $5,
            hafta_sonu_mesai_sla = $6,
            hafta_sonu_mesai_disi_sla = $7,
            sla_next_day_start = $8,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $9
          WHERE id = $10
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
            message: 'Group not found'
          });
        }

        // Format the response
        const group = {
          ...result.rows[0],
          subcategoryId: result.rows[0].subcategory_id,
          mesai_saatleri_sla: result.rows[0].mesai_saatleri_sla,
          mesai_disi_sla: result.rows[0].mesai_disi_sla,
          hafta_sonu_mesai_sla: result.rows[0].hafta_sonu_mesai_sla,
          hafta_sonu_mesai_disi_sla: result.rows[0].hafta_sonu_mesai_disi_sla,
          sla_next_day_start: result.rows[0].sla_next_day_start,
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete group.subcategory_id;
        delete group.created_at;
        delete group.created_by;
        delete group.updated_at;
        delete group.updated_by;
        delete group.is_deleted;

        return res.status(200).json({
          success: true,
          message: 'Group updated successfully',
          data: group
        });
      } else {
        // Create new group
        query = `
          INSERT INTO groups (
            name,
            description,
            subcategory_id,
            mesai_saatleri_sla,
            mesai_disi_sla,
            hafta_sonu_mesai_sla,
            hafta_sonu_mesai_disi_sla,
            sla_next_day_start,
            created_at,
            created_by,
            updated_at,
            is_deleted
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            CURRENT_TIMESTAMP, $8, CURRENT_TIMESTAMP, false 
          )
          RETURNING *;
        `;

        const result = await client.query(query, [
          ...params,
          req.body.created_by || null,
        ]);

        // Format the response
        const group = {
          ...result.rows[0],
          subcategoryId: result.rows[0].subcategory_id,
          mesai_saatleri_sla: result.rows[0].mesai_saatleri_sla,
          mesai_disi_sla: result.rows[0].mesai_disi_sla,
          hafta_sonu_mesai_sla: result.rows[0].hafta_sonu_mesai_sla,
          hafta_sonu_mesai_disi_sla: result.rows[0].hafta_sonu_mesai_disi_sla,
          sla_next_day_start: result.rows[0].sla_next_day_start,
          createdAt: result.rows[0].created_at,
          createdBy: result.rows[0].created_by,
          updatedAt: result.rows[0].updated_at,
          updatedBy: result.rows[0].updated_by,
          isDeleted: result.rows[0].is_deleted
        };

        // Remove snake_case fields
        delete group.subcategory_id;
        delete group.created_at;
        delete group.created_by;
        delete group.updated_at;
        delete group.updated_by;
        delete group.is_deleted;

        return res.status(201).json({
          success: true,
          message: 'Group created successfully',
          data: group
        });
      }
    });
  } catch (error: any) {
    console.error('Create/Update group API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
}
