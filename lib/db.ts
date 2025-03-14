import { Pool } from 'pg';

// Veritabanı bağlantı havuzu oluşturma
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Bağlantı hatalarını yakalama
pool.on('error', (err) => {
  console.error('Beklenmeyen veritabanı hatası:', err);
});

// Dışa aktarılan metotlar
export default {
  /**
   * SQL sorgusu çalıştırma
   * @param text SQL sorgusu
   * @param params Sorgu parametreleri
   */
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  /**
   * Veritabanı bağlantısı alma
   * Uzun işlemler veya transaction'lar için kullanılabilir
   */
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    
    // Bağlantıyı serbest bırakma metodunu override ederek
    // bağlantının zamanında serbest bırakılmasını sağlama
    client.release = () => {
      release.apply(client);
    };
    
    // client.query metodunu override ederek hata yakalama
    client.query = (...args: any[]) => {
      return query.apply(client, args).catch((err: Error) => {
        console.error('Sorgu hatası:', err);
        // Hata durumunda bağlantıyı serbest bırakma
        client.release();
        throw err;
      });
    };
    
    return client;
  }
};
