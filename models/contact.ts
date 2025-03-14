import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Contact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class ContactModel {
  /**
   * Kişiyi ID'ye göre bulur
   */
  static async findById(id: string): Promise<Contact | null> {
    const result = await db.query(
      'SELECT * FROM contacts WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Şirket ID'sine göre kişileri listeler
   */
  static async findByCompanyId(companyId: string): Promise<Contact[]> {
    const result = await db.query(
      'SELECT * FROM contacts WHERE company_id = $1 AND is_deleted = false ORDER BY first_name, last_name',
      [companyId]
    );
    return result.rows;
  }

  /**
   * Şirketin birincil kişisini bulur
   */
  static async findPrimaryContactByCompanyId(companyId: string): Promise<Contact | null> {
    const result = await db.query(
      'SELECT * FROM contacts WHERE company_id = $1 AND is_primary = true AND is_deleted = false',
      [companyId]
    );
    return result.rows[0] || null;
  }

  /**
   * E-posta adresine göre kişi arar
   */
  static async findByEmail(email: string): Promise<Contact | null> {
    const result = await db.query(
      'SELECT * FROM contacts WHERE email = $1 AND is_deleted = false',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm kişileri listeler
   */
  static async findAll(options: {
    company_id?: string;
    is_active?: boolean;
    is_primary?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Contact[]> {
    let query = 'SELECT * FROM contacts WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.company_id) {
      query += ` AND company_id = $${paramIndex}`;
      params.push(options.company_id);
      paramIndex++;
    }

    if (options.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(options.is_active);
      paramIndex++;
    }

    if (options.is_primary !== undefined) {
      query += ` AND is_primary = $${paramIndex}`;
      params.push(options.is_primary);
      paramIndex++;
    }

    if (options.search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY first_name, last_name';

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
   * Toplam kişi sayısını döndürür
   */
  static async count(options: {
    company_id?: string;
    is_active?: boolean;
    is_primary?: boolean;
    search?: string;
  } = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM contacts WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.company_id) {
      query += ` AND company_id = $${paramIndex}`;
      params.push(options.company_id);
      paramIndex++;
    }

    if (options.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(options.is_active);
      paramIndex++;
    }

    if (options.is_primary !== undefined) {
      query += ` AND is_primary = $${paramIndex}`;
      params.push(options.is_primary);
      paramIndex++;
    }

    if (options.search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Yeni kişi oluşturur
   */
  static async create(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const id = uuidv4();
      const now = new Date();
      
      // Eğer bu kişi birincil kişi olarak işaretlendiyse, aynı şirketteki diğer birincil kişileri güncelle
      if (contactData.is_primary) {
        await client.query(
          'UPDATE contacts SET is_primary = false WHERE company_id = $1 AND is_primary = true AND is_deleted = false',
          [contactData.company_id]
        );
      }
      
      const result = await client.query(
        `INSERT INTO contacts (
          id, company_id, first_name, last_name, title, department, email, phone, mobile,
          address, city, state, postal_code, country, notes, is_primary, is_active,
          created_at, created_by, updated_at, updated_by, is_deleted
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22
        ) RETURNING *`,
        [
          id, contactData.company_id, contactData.first_name, contactData.last_name,
          contactData.title, contactData.department, contactData.email, contactData.phone,
          contactData.mobile, contactData.address, contactData.city, contactData.state,
          contactData.postal_code, contactData.country, contactData.notes,
          contactData.is_primary, contactData.is_active, now, contactData.created_by,
          now, contactData.updated_by, false
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating contact:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kişi bilgilerini günceller
   */
  static async update(id: string, contactData: Partial<Contact>): Promise<Contact | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut kişiyi kontrol et
      const checkResult = await client.query(
        'SELECT * FROM contacts WHERE id = $1 AND is_deleted = false',
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const existingContact = checkResult.rows[0];
      const now = new Date();

      // Eğer bu kişi birincil kişi olarak işaretlendiyse, aynı şirketteki diğer birincil kişileri güncelle
      if (contactData.is_primary && !existingContact.is_primary) {
        await client.query(
          'UPDATE contacts SET is_primary = false WHERE company_id = $1 AND is_primary = true AND is_deleted = false',
          [existingContact.company_id]
        );
      }

      // Güncellenecek alanları belirle
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (contactData.company_id !== undefined) {
        updates.push(`company_id = $${paramIndex}`);
        values.push(contactData.company_id);
        paramIndex++;
      }

      if (contactData.first_name !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(contactData.first_name);
        paramIndex++;
      }

      if (contactData.last_name !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(contactData.last_name);
        paramIndex++;
      }

      if (contactData.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(contactData.title);
        paramIndex++;
      }

      if (contactData.department !== undefined) {
        updates.push(`department = $${paramIndex}`);
        values.push(contactData.department);
        paramIndex++;
      }

      if (contactData.email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(contactData.email);
        paramIndex++;
      }

      if (contactData.phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        values.push(contactData.phone);
        paramIndex++;
      }

      if (contactData.mobile !== undefined) {
        updates.push(`mobile = $${paramIndex}`);
        values.push(contactData.mobile);
        paramIndex++;
      }

      if (contactData.address !== undefined) {
        updates.push(`address = $${paramIndex}`);
        values.push(contactData.address);
        paramIndex++;
      }

      if (contactData.city !== undefined) {
        updates.push(`city = $${paramIndex}`);
        values.push(contactData.city);
        paramIndex++;
      }

      if (contactData.state !== undefined) {
        updates.push(`state = $${paramIndex}`);
        values.push(contactData.state);
        paramIndex++;
      }

      if (contactData.postal_code !== undefined) {
        updates.push(`postal_code = $${paramIndex}`);
        values.push(contactData.postal_code);
        paramIndex++;
      }

      if (contactData.country !== undefined) {
        updates.push(`country = $${paramIndex}`);
        values.push(contactData.country);
        paramIndex++;
      }

      if (contactData.notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(contactData.notes);
        paramIndex++;
      }

      if (contactData.is_primary !== undefined) {
        updates.push(`is_primary = $${paramIndex}`);
        values.push(contactData.is_primary);
        paramIndex++;
      }

      if (contactData.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(contactData.is_active);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (contactData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(contactData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut kişiyi döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE contacts 
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
      console.error('Error updating contact:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kişiyi soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE contacts 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }

  /**
   * Tam adı döndürür
   */
  static getFullName(contact: Contact): string {
    return `${contact.first_name} ${contact.last_name}`;
  }
}
