import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'manager' | 'agent';
  department?: string;
  status: 'active' | 'inactive';
  last_login?: Date;
  profile_image_url?: string;
  created_at: Date;
  created_by?: string;
  updated_at: Date;
  updated_by?: string;
  is_deleted: boolean;
}

export class UserModel {
  /**
   * Kullanıcıyı ID'ye göre bulur
   */
  static async findById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * E-posta adresine göre kullanıcı bulur
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_deleted = false',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm kullanıcıları listeler
   */
  static async findAll(options: { 
    role?: string, 
    department?: string, 
    status?: string,
    limit?: number,
    offset?: number
  } = {}): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(options.role);
      paramIndex++;
    }

    if (options.department) {
      query += ` AND department = $${paramIndex}`;
      params.push(options.department);
      paramIndex++;
    }

    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
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
   * Toplam kullanıcı sayısını döndürür
   */
  static async count(options: { 
    role?: string, 
    department?: string, 
    status?: string 
  } = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM users WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(options.role);
      paramIndex++;
    }

    if (options.department) {
      query += ` AND department = $${paramIndex}`;
      params.push(options.department);
      paramIndex++;
    }

    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Yeni kullanıcı oluşturur
   */
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO users (
        id, name, email, password_hash, role, department, status, 
        last_login, profile_image_url, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        id, userData.name, userData.email, userData.password_hash, 
        userData.role, userData.department, userData.status,
        userData.last_login, userData.profile_image_url, now, userData.created_by, 
        now, userData.updated_by, false
      ]
    );
    
    return result.rows[0];
  }

  /**
   * Kullanıcı bilgilerini günceller
   */
  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Önce mevcut kullanıcıyı kontrol et
      const checkResult = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_deleted = false',
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const currentUser = checkResult.rows[0];
      const now = new Date();
      
      // Güncellenecek alanları belirle
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (userData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(userData.name);
        paramIndex++;
      }
      
      if (userData.email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(userData.email);
        paramIndex++;
      }
      
      if (userData.password_hash !== undefined) {
        updates.push(`password_hash = $${paramIndex}`);
        values.push(userData.password_hash);
        paramIndex++;
      }
      
      if (userData.role !== undefined) {
        updates.push(`role = $${paramIndex}`);
        values.push(userData.role);
        paramIndex++;
      }
      
      if (userData.department !== undefined) {
        updates.push(`department = $${paramIndex}`);
        values.push(userData.department);
        paramIndex++;
      }
      
      if (userData.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(userData.status);
        paramIndex++;
      }
      
      if (userData.last_login !== undefined) {
        updates.push(`last_login = $${paramIndex}`);
        values.push(userData.last_login);
        paramIndex++;
      }
      
      if (userData.profile_image_url !== undefined) {
        updates.push(`profile_image_url = $${paramIndex}`);
        values.push(userData.profile_image_url);
        paramIndex++;
      }
      
      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;
      
      if (userData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(userData.updated_by);
        paramIndex++;
      }
      
      // Eğer güncellenecek alan yoksa, mevcut kullanıcıyı döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return currentUser;
      }
      
      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE users 
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
      console.error('Error updating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcıyı soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();
    
    const result = await db.query(
      `UPDATE users 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );
    
    return result.rowCount > 0;
  }
}
