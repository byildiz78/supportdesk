import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export interface DepartmentUser {
  id: string;
  department_id: string;
  user_id: string;
  created_at: Date;
  created_by: string;
  is_deleted: boolean;
}

export class DepartmentModel {
  /**
   * Departmanı ID'ye göre bulur
   */
  static async findById(id: string): Promise<Department | null> {
    const result = await db.query(
      'SELECT * FROM departments WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * İsme göre departman arar
   */
  static async findByName(name: string): Promise<Department | null> {
    const result = await db.query(
      'SELECT * FROM departments WHERE name = $1 AND is_deleted = false',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm departmanları listeler
   */
  static async findAll(options: {
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Department[]> {
    let query = 'SELECT * FROM departments WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(options.is_active);
      paramIndex++;
    }

    if (options.search) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY name';

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Kullanıcı ID'sine göre departmanları listeler
   */
  static async findByUserId(userId: string): Promise<Department[]> {
    const result = await db.query(
      `SELECT d.* 
       FROM departments d
       JOIN department_users du ON d.id = du.department_id
       WHERE du.user_id = $1 
       AND d.is_deleted = false 
       AND du.is_deleted = false
       ORDER BY d.name`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Yeni departman oluşturur
   */
  static async create(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO departments (
        id, name, description, manager_id, is_active, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        id, departmentData.name, departmentData.description, departmentData.manager_id,
        departmentData.is_active, now, departmentData.created_by, now, departmentData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Departman bilgilerini günceller
   */
  static async update(id: string, departmentData: Partial<Department>): Promise<Department | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut departmanı kontrol et
      const checkResult = await client.query(
        'SELECT * FROM departments WHERE id = $1 AND is_deleted = false',
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

      if (departmentData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(departmentData.name);
        paramIndex++;
      }

      if (departmentData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(departmentData.description);
        paramIndex++;
      }

      if (departmentData.manager_id !== undefined) {
        updates.push(`manager_id = $${paramIndex}`);
        values.push(departmentData.manager_id);
        paramIndex++;
      }

      if (departmentData.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(departmentData.is_active);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (departmentData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(departmentData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut departmanı döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE departments 
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
      console.error('Error updating department:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Departmanı soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE departments 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }

  /**
   * Departmana kullanıcı ekler
   */
  static async addUserToDepartment(departmentId: string, userId: string, createdBy: string): Promise<DepartmentUser> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO department_users (
        id, department_id, user_id, created_at, created_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [id, departmentId, userId, now, createdBy, false]
    );

    return result.rows[0];
  }

  /**
   * Departmandan kullanıcıyı kaldırır
   */
  static async removeUserFromDepartment(departmentId: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE department_users 
       SET is_deleted = true 
       WHERE department_id = $1 AND user_id = $2 AND is_deleted = false`,
      [departmentId, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Departman kullanıcılarını listeler
   */
  static async findUsersByDepartmentId(departmentId: string): Promise<string[]> {
    const result = await db.query(
      `SELECT user_id 
       FROM department_users 
       WHERE department_id = $1 AND is_deleted = false`,
      [departmentId]
    );
    
    return result.rows.map(row => row.user_id);
  }

  /**
   * Departman kullanıcılarını günceller (mevcut kullanıcıları kaldırır ve yenilerini ekler)
   */
  static async updateDepartmentUsers(departmentId: string, userIds: string[], createdBy: string): Promise<boolean> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Mevcut kullanıcıları kaldır
      await client.query(
        `UPDATE department_users 
         SET is_deleted = true 
         WHERE department_id = $1 AND is_deleted = false`,
        [departmentId]
      );

      // Yeni kullanıcıları ekle
      for (const userId of userIds) {
        const id = uuidv4();
        const now = new Date();

        await client.query(
          `INSERT INTO department_users (
            id, department_id, user_id, created_at, created_by, is_deleted
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, departmentId, userId, now, createdBy, false]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating department users:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
