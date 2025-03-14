import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Group {
  id: string;
  subcategory_id: string;
  name: string;
  description?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class GroupModel {
  /**
   * Grubu ID'ye göre bulur
   */
  static async findById(id: string): Promise<Group | null> {
    const result = await db.query(
      'SELECT * FROM groups WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Alt kategori ID'sine göre grupları listeler
   */
  static async findBySubcategoryId(subcategoryId: string): Promise<Group[]> {
    const result = await db.query(
      'SELECT * FROM groups WHERE subcategory_id = $1 AND is_deleted = false ORDER BY name',
      [subcategoryId]
    );
    return result.rows;
  }

  /**
   * Tüm grupları listeler
   */
  static async findAll(): Promise<Group[]> {
    const result = await db.query(
      'SELECT * FROM groups WHERE is_deleted = false ORDER BY name'
    );
    return result.rows;
  }

  /**
   * Yeni grup oluşturur
   */
  static async create(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO groups (
        id, subcategory_id, name, description, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        id, groupData.subcategory_id, groupData.name, groupData.description, 
        now, groupData.created_by, now, groupData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Grup bilgilerini günceller
   */
  static async update(id: string, groupData: Partial<Group>): Promise<Group | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut grubu kontrol et
      const checkResult = await client.query(
        'SELECT * FROM groups WHERE id = $1 AND is_deleted = false',
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const now = new Date();

      // Güncellenecek alanları belirle
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (groupData.subcategory_id !== undefined) {
        updates.push(`subcategory_id = $${paramIndex}`);
        values.push(groupData.subcategory_id);
        paramIndex++;
      }

      if (groupData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(groupData.name);
        paramIndex++;
      }

      if (groupData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(groupData.description);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (groupData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(groupData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut grubu döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE groups 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} AND is_deleted = false 
        RETURNING *
      `;
      values.push(id);

      const updateResult = await client.query(updateQuery, values);
      await client.query('COMMIT');

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating group:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Grubu soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE groups 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }
}
