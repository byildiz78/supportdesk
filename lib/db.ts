import mysql from 'mysql2/promise';

// MySQL bağlantı havuzu oluştur
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supportdesk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// SQL sorgusu çalıştırmak için yardımcı fonksiyon
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
