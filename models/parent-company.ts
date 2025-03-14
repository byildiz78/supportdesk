import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface ParentCompany {
  id: string;
  name: string;
  tax_id?: string;
  tax_office?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  company_type?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class ParentCompanyModel {
  /**
   * Ana şirketi ID'ye göre bulur
   */
  static async findById(id: string): Promise<ParentCompany | null> {
    const result = await db.query(
      'SELECT * FROM parent_companies WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * İsme göre ana şirket arar
   */
  static async findByName(name: string): Promise<ParentCompany | null> {
    const result = await db.query(
      'SELECT * FROM parent_companies WHERE name = $1 AND is_deleted = false',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm ana şirketleri listeler
   */
  static async findAll(options: {
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ParentCompany[]> {
    let query = 'SELECT * FROM parent_companies WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(options.is_active);
      paramIndex++;
    }

    if (options.search) {
      query += ` AND (name ILIKE $${paramIndex} OR tax_id ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`;
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
   * Toplam ana şirket sayısını döndürür
   */
  static async count(options: {
    is_active?: boolean;
    search?: string;
  } = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM parent_companies WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(options.is_active);
      paramIndex++;
    }

    if (options.search) {
      query += ` AND (name ILIKE $${paramIndex} OR tax_id ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Yeni ana şirket oluşturur
   */
  static async create(companyData: Omit<ParentCompany, 'id' | 'created_at' | 'updated_at'>): Promise<ParentCompany> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO parent_companies (
        id, name, tax_id, tax_office, address, city, state, postal_code,
        country, phone, email, website, industry, company_type, notes,
        is_active, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        id, companyData.name, companyData.tax_id, companyData.tax_office,
        companyData.address, companyData.city, companyData.state, companyData.postal_code,
        companyData.country, companyData.phone, companyData.email, companyData.website,
        companyData.industry, companyData.company_type, companyData.notes,
        companyData.is_active, now, companyData.created_by, now, companyData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Ana şirket bilgilerini günceller
   */
  static async update(id: string, companyData: Partial<ParentCompany>): Promise<ParentCompany | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut ana şirketi kontrol et
      const checkResult = await client.query(
        'SELECT * FROM parent_companies WHERE id = $1 AND is_deleted = false',
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

      if (companyData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(companyData.name);
        paramIndex++;
      }

      if (companyData.tax_id !== undefined) {
        updates.push(`tax_id = $${paramIndex}`);
        values.push(companyData.tax_id);
        paramIndex++;
      }

      if (companyData.tax_office !== undefined) {
        updates.push(`tax_office = $${paramIndex}`);
        values.push(companyData.tax_office);
        paramIndex++;
      }

      if (companyData.address !== undefined) {
        updates.push(`address = $${paramIndex}`);
        values.push(companyData.address);
        paramIndex++;
      }

      if (companyData.city !== undefined) {
        updates.push(`city = $${paramIndex}`);
        values.push(companyData.city);
        paramIndex++;
      }

      if (companyData.state !== undefined) {
        updates.push(`state = $${paramIndex}`);
        values.push(companyData.state);
        paramIndex++;
      }

      if (companyData.postal_code !== undefined) {
        updates.push(`postal_code = $${paramIndex}`);
        values.push(companyData.postal_code);
        paramIndex++;
      }

      if (companyData.country !== undefined) {
        updates.push(`country = $${paramIndex}`);
        values.push(companyData.country);
        paramIndex++;
      }

      if (companyData.phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        values.push(companyData.phone);
        paramIndex++;
      }

      if (companyData.email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(companyData.email);
        paramIndex++;
      }

      if (companyData.website !== undefined) {
        updates.push(`website = $${paramIndex}`);
        values.push(companyData.website);
        paramIndex++;
      }

      if (companyData.industry !== undefined) {
        updates.push(`industry = $${paramIndex}`);
        values.push(companyData.industry);
        paramIndex++;
      }

      if (companyData.company_type !== undefined) {
        updates.push(`company_type = $${paramIndex}`);
        values.push(companyData.company_type);
        paramIndex++;
      }

      if (companyData.notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(companyData.notes);
        paramIndex++;
      }

      if (companyData.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(companyData.is_active);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (companyData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(companyData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut ana şirketi döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE parent_companies 
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
      console.error('Error updating parent company:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ana şirketi soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE parent_companies 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }
}
