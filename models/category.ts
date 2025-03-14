import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class CategoryModel {
  /**
   * Kategoriyi ID'ye göre bulur
   */
  static async findById(id: string): Promise<Category | null> {
    const result = await db.query(
      'SELECT * FROM categories WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm kategorileri listeler
   */
  static async findAll(): Promise<Category[]> {
    const result = await db.query(
      'SELECT * FROM categories WHERE is_deleted = false ORDER BY name'
    );
    return result.rows;
  }

  /**
   * Yeni kategori oluşturur
   */
  static async create(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO categories (
        id, name, description, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        id, categoryData.name, categoryData.description, 
        now, categoryData.created_by, now, categoryData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Kategori bilgilerini günceller
   */
  static async update(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut kategoriyi kontrol et
      const checkResult = await client.query(
        'SELECT * FROM categories WHERE id = $1 AND is_deleted = false',
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

      if (categoryData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(categoryData.name);
        paramIndex++;
      }

      if (categoryData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(categoryData.description);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (categoryData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(categoryData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut kategoriyi döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE categories 
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
      console.error('Error updating category:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kategoriyi soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE categories 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }
}
