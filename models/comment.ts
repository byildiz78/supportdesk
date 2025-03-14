import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  is_deleted: boolean;
}

export class CommentModel {
  /**
   * Yorumu ID'ye göre bulur
   */
  static async findById(id: string): Promise<Comment | null> {
    const result = await db.query(
      'SELECT * FROM comments WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Bilet ID'sine göre yorumları listeler
   */
  static async findByTicketId(ticketId: string, options: {
    is_internal?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    let query = 'SELECT * FROM comments WHERE ticket_id = $1 AND is_deleted = false';
    const params: any[] = [ticketId];
    let paramIndex = 2;

    if (options.is_internal !== undefined) {
      query += ` AND is_internal = $${paramIndex}`;
      params.push(options.is_internal);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

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
   * Kullanıcı ID'sine göre yorumları listeler
   */
  static async findByUserId(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    let query = 'SELECT * FROM comments WHERE user_id = $1 AND is_deleted = false';
    const params: any[] = [userId];
    let paramIndex = 2;

    query += ' ORDER BY created_at DESC';

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
   * Yeni yorum oluşturur
   */
  static async create(commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const id = uuidv4();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO comments (
        id, ticket_id, user_id, content, is_internal, 
        created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        id, commentData.ticket_id, commentData.user_id, commentData.content, 
        commentData.is_internal, now, commentData.created_by, now, commentData.updated_by, false
      ]
    );

    return result.rows[0];
  }

  /**
   * Yorum bilgilerini günceller
   */
  static async update(id: string, commentData: Partial<Comment>): Promise<Comment | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Önce mevcut yorumu kontrol et
      const checkResult = await client.query(
        'SELECT * FROM comments WHERE id = $1 AND is_deleted = false',
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

      if (commentData.content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        values.push(commentData.content);
        paramIndex++;
      }

      if (commentData.is_internal !== undefined) {
        updates.push(`is_internal = $${paramIndex}`);
        values.push(commentData.is_internal);
        paramIndex++;
      }

      // Her zaman updated_at ve updated_by alanlarını güncelle
      updates.push(`updated_at = $${paramIndex}`);
      values.push(now);
      paramIndex++;

      if (commentData.updated_by !== undefined) {
        updates.push(`updated_by = $${paramIndex}`);
        values.push(commentData.updated_by);
        paramIndex++;
      }

      // Eğer güncellenecek alan yoksa, mevcut yorumu döndür
      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return checkResult.rows[0];
      }

      // Güncelleme sorgusunu oluştur
      const updateQuery = `
        UPDATE comments 
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
      console.error('Error updating comment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Yorumu soft delete yapar
   */
  static async delete(id: string, deletedBy: string): Promise<boolean> {
    const now = new Date();

    const result = await db.query(
      `UPDATE comments 
       SET is_deleted = true, updated_at = $1, updated_by = $2 
       WHERE id = $3 AND is_deleted = false`,
      [now, deletedBy, id]
    );

    return result.rowCount > 0;
  }

  /**
   * Bilet için yorum sayısını döndürür
   */
  static async countByTicketId(ticketId: string, options: {
    is_internal?: boolean;
  } = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM comments WHERE ticket_id = $1 AND is_deleted = false';
    const params: any[] = [ticketId];
    let paramIndex = 2;

    if (options.is_internal !== undefined) {
      query += ` AND is_internal = $${paramIndex}`;
      params.push(options.is_internal);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}
