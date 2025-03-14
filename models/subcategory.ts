import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class SubcategoryModel {
  /**
   * Alt kategoriyi ID'ye göre bulur
   */
  static async findById(id: string): Promise<Subcategory | null> {
    const result = await db.query(
      'SELECT * FROM subcategories WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Kategori ID'sine göre alt kategorileri listeler
   */
  static async findByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const result = await db.query(
      'SELECT * FROM subcategories WHERE category_id = $1 AND is_deleted = false ORDER BY name',
      [categoryId]
    );
    return result.rows;
  }

  /**
   * Tüm alt kategorileri listeler
   */
  static async findAll(): Promise<Subcategory[]> {
    const result = await db.query(
      'SELECT * FROM subcategories WHERE is_deleted = false ORDER BY name'
    );
    return result.rows;
  }

  /**
   * Yeni alt kategori oluşturur
   */
  static async create(subcategoryData: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>): Promise<Subcategory> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO subcategories (
        id, category_id, name, description, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        id, subcategoryData.category_id, subcategoryData.name, subcategoryData.description, 
        now, subcategoryData.created_by, now, subcategoryData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Alt kategori bilgilerini günceller
   */
  static async update(id: string, subcategoryData: Partial<Subcategory>): Promise<Subcategory | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut alt kategoriyi kontrol et
      const checkResult = await client.query(
        'SELECT * FROM subcategories WHERE id = $1 AND is_deleted = false',
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

      if (subcategoryData.category_id !== undefined) {
        updates.push(`category_id = $${paramIndex}`);
        values.push(subcategoryData.category_id);
        paramIndex++;
      }

      if (subcategoryData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(subcategoryData.name);
        paramIndex++;
      }

      if (subcategoryData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(subcategoryData.description);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (subcategoryData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(subcategoryData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut alt kategoriyi döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE subcategories 
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
      console.error('Error updating subcategory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Alt kategoriyi soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE subcategories 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }
}
