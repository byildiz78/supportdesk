import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export interface TicketTag {
  id: string;
  ticket_id: string;
  tag_id: string;
  created_at: Date;
  created_by: string;
  is_deleted: boolean;
}

export class TagModel {
  /**
   * Etiketi ID'ye göre bulur
   */
  static async findById(id: string): Promise<Tag | null> {
    const result = await db.query(
      'SELECT * FROM tags WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * İsme göre etiket arar
   */
  static async findByName(name: string): Promise<Tag | null> {
    const result = await db.query(
      'SELECT * FROM tags WHERE name = $1 AND is_deleted = false',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Tüm etiketleri listeler
   */
  static async findAll(options: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Tag[]> {
    let query = 'SELECT * FROM tags WHERE is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

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
   * Bilet ID'sine göre etiketleri listeler
   */
  static async findByTicketId(ticketId: string): Promise<Tag[]> {
    const result = await db.query(
      `SELECT t.* 
       FROM tags t
       JOIN ticket_tags tt ON t.id = tt.tag_id
       WHERE tt.ticket_id = $1 
       AND t.is_deleted = false 
       AND tt.is_deleted = false
       ORDER BY t.name`,
      [ticketId]
    );
    return result.rows;
  }

  /**
   * Yeni etiket oluşturur
   */
  static async create(tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO tags (
        id, name, color, description, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        id, tagData.name, tagData.color, tagData.description, 
        now, tagData.created_by, now, tagData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Etiket bilgilerini günceller
   */
  static async update(id: string, tagData: Partial<Tag>): Promise<Tag | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut etiketi kontrol et
      const checkResult = await client.query(
        'SELECT * FROM tags WHERE id = $1 AND is_deleted = false',
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

      if (tagData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(tagData.name);
        paramIndex++;
      }

      if (tagData.color !== undefined) {
        updates.push(`color = $${paramIndex}`);
        values.push(tagData.color);
        paramIndex++;
      }

      if (tagData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(tagData.description);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (tagData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(tagData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut etiketi döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE tags 
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
      console.error('Error updating tag:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Etiketi soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE tags 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }

  /**
   * Bilete etiket ekler
   */
  static async addTagToTicket(ticketId: string, tagId: string, userId: string): Promise<TicketTag> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO ticket_tags (
        id, ticket_id, tag_id, created_at, created_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [id, ticketId, tagId, now, userId, false]
    );

    return result.rows[0];
  }

  /**
   * Biletten etiketi kaldırır
   */
  static async removeTagFromTicket(ticketId: string, tagId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE ticket_tags 
       SET is_deleted = true 
       WHERE ticket_id = $1 AND tag_id = $2 AND is_deleted = false`,
      [ticketId, tagId]
    );

    return result.rowCount > 0;
  }

  /**
   * Biletten tüm etiketleri kaldırır
   */
  static async removeAllTagsFromTicket(ticketId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE ticket_tags 
       SET is_deleted = true 
       WHERE ticket_id = $1 AND is_deleted = false`,
      [ticketId]
    );

    return result.rowCount > 0;
  }

  /**
   * Bilet etiketlerini günceller (mevcut etiketleri kaldırır ve yenilerini ekler)
   */
  static async updateTicketTags(ticketId: string, tagIds: string[], userId: string): Promise<boolean> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Mevcut etiketleri kaldır
      await client.query(
        `UPDATE ticket_tags 
         SET is_deleted = true 
         WHERE ticket_id = $1 AND is_deleted = false`,
        [ticketId]
      );

      // Yeni etiketleri ekle
      for (const tagId of tagIds) {
        const id = uuidv4();
        const now = new Date();

        await client.query(
          `INSERT INTO ticket_tags (
            id, ticket_id, tag_id, created_at, created_by, is_deleted
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, ticketId, tagId, now, userId, false]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating ticket tags:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
