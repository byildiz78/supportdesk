import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'email' | 'phone' | 'web' | 'chat';
  category_id?: string;
  subcategory_id?: string;
  group_id?: string;
  assigned_to?: string;
  parent_company_id?: string;
  company_id?: string;
  contact_id?: string;
  due_date?: Date;
  resolution_time?: number;
  sla_breach: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class TicketModel {
  /**
   * Bileti ID'ye göre bulur
   */
  static async findById(id: string): Promise<Ticket | null> {
    const result = await db.query(
      'SELECT * FROM tickets WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Biletleri filtreler ve listeler
   */
  static async findAll(options: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    category_id?: string;
    subcategory_id?: string;
    group_id?: string;
    parent_company_id?: string;
    company_id?: string;
    contact_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  } = {}): Promise<Ticket[]> {
    let query = 'SELECT * FROM tickets WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    // Filtreleri ekle
    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(options.priority);
      paramIndex++;
    }

    if (options.assigned_to) {
      query += ` AND assigned_to = $${paramIndex}`;
      params.push(options.assigned_to);
      paramIndex++;
    }

    if (options.category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(options.category_id);
      paramIndex++;
    }

    if (options.subcategory_id) {
      query += ` AND subcategory_id = $${paramIndex}`;
      params.push(options.subcategory_id);
      paramIndex++;
    }

    if (options.group_id) {
      query += ` AND group_id = $${paramIndex}`;
      params.push(options.group_id);
      paramIndex++;
    }

    if (options.parent_company_id) {
      query += ` AND parent_company_id = $${paramIndex}`;
      params.push(options.parent_company_id);
      paramIndex++;
    }

    if (options.company_id) {
      query += ` AND company_id = $${paramIndex}`;
      params.push(options.company_id);
      paramIndex++;
    }

    if (options.contact_id) {
      query += ` AND contact_id = $${paramIndex}`;
      params.push(options.contact_id);
      paramIndex++;
    }

    // Arama filtresi
    if (options.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    // Sıralama
    const sortBy = options.sort_by || 'created_at';
    const sortOrder = options.sort_order || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Sayfalama
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
   * Toplam bilet sayısını döndürür
   */
  static async count(options: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    category_id?: string;
    subcategory_id?: string;
    group_id?: string;
    parent_company_id?: string;
    company_id?: string;
    contact_id?: string;
    search?: string;
  } = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM tickets WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    // Filtreleri ekle
    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(options.priority);
      paramIndex++;
    }

    if (options.assigned_to) {
      query += ` AND assigned_to = $${paramIndex}`;
      params.push(options.assigned_to);
      paramIndex++;
    }

    if (options.category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(options.category_id);
      paramIndex++;
    }

    if (options.subcategory_id) {
      query += ` AND subcategory_id = $${paramIndex}`;
      params.push(options.subcategory_id);
      paramIndex++;
    }

    if (options.group_id) {
      query += ` AND group_id = $${paramIndex}`;
      params.push(options.group_id);
      paramIndex++;
    }

    if (options.parent_company_id) {
      query += ` AND parent_company_id = $${paramIndex}`;
      params.push(options.parent_company_id);
      paramIndex++;
    }

    if (options.company_id) {
      query += ` AND company_id = $${paramIndex}`;
      params.push(options.company_id);
      paramIndex++;
    }

    if (options.contact_id) {
      query += ` AND contact_id = $${paramIndex}`;
      params.push(options.contact_id);
      paramIndex++;
    }

    // Arama filtresi
    if (options.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Yeni bilet oluşturur
   */
  static async create(ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO tickets (
        id, title, description, status, priority, source,
        category_id, subcategory_id, group_id, assigned_to,
        parent_company_id, company_id, contact_id, due_date,
        resolution_time, sla_breach, created_at, created_by,
        updated_at, updated_by, is_deleted
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        id, ticketData.title, ticketData.description, ticketData.status,
        ticketData.priority, ticketData.source, ticketData.category_id,
        ticketData.subcategory_id, ticketData.group_id, ticketData.assigned_to,
        ticketData.parent_company_id, ticketData.company_id, ticketData.contact_id,
        ticketData.due_date, ticketData.resolution_time, ticketData.sla_breach,
        now, ticketData.created_by, now, ticketData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Bilet bilgilerini günceller
   */
  static async update(id: string, ticketData: Partial<Ticket>): Promise<Ticket | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut bileti kontrol et
      const checkResult = await client.query(
        'SELECT * FROM tickets WHERE id = $1 AND is_deleted = false',
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

      if (ticketData.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(ticketData.title);
        paramIndex++;
      }

      if (ticketData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(ticketData.description);
        paramIndex++;
      }

      if (ticketData.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(ticketData.status);
        paramIndex++;
      }

      if (ticketData.priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        values.push(ticketData.priority);
        paramIndex++;
      }

      if (ticketData.source !== undefined) {
        updates.push(`source = $${paramIndex}`);
        values.push(ticketData.source);
        paramIndex++;
      }

      if (ticketData.category_id !== undefined) {
        updates.push(`category_id = $${paramIndex}`);
        values.push(ticketData.category_id);
        paramIndex++;
      }

      if (ticketData.subcategory_id !== undefined) {
        updates.push(`subcategory_id = $${paramIndex}`);
        values.push(ticketData.subcategory_id);
        paramIndex++;
      }

      if (ticketData.group_id !== undefined) {
        updates.push(`group_id = $${paramIndex}`);
        values.push(ticketData.group_id);
        paramIndex++;
      }

      if (ticketData.assigned_to !== undefined) {
        updates.push(`assigned_to = $${paramIndex}`);
        values.push(ticketData.assigned_to);
        paramIndex++;
      }

      if (ticketData.parent_company_id !== undefined) {
        updates.push(`parent_company_id = $${paramIndex}`);
        values.push(ticketData.parent_company_id);
        paramIndex++;
      }

      if (ticketData.company_id !== undefined) {
        updates.push(`company_id = $${paramIndex}`);
        values.push(ticketData.company_id);
        paramIndex++;
      }

      if (ticketData.contact_id !== undefined) {
        updates.push(`contact_id = $${paramIndex}`);
        values.push(ticketData.contact_id);
        paramIndex++;
      }

      if (ticketData.due_date !== undefined) {
        updates.push(`due_date = $${paramIndex}`);
        values.push(ticketData.due_date);
        paramIndex++;
      }

      if (ticketData.resolution_time !== undefined) {
        updates.push(`resolution_time = $${paramIndex}`);
        values.push(ticketData.resolution_time);
        paramIndex++;
      }

      if (ticketData.sla_breach !== undefined) {
        updates.push(`sla_breach = $${paramIndex}`);
        values.push(ticketData.sla_breach);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (ticketData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(ticketData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut bileti döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE tickets 
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
      console.error('Error updating ticket:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bileti soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE tickets 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }
}
