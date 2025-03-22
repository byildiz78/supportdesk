import { Pool, PoolClient } from 'pg';

// Create a singleton pool instance
let pool: Pool | null = null;

export const getPool = (): Pool => {
  // Tarayıcı ortamında çalışırken boş bir nesne döndür
  if (typeof window !== 'undefined') {
    console.warn('PostgreSQL connections are not supported in browser environment');
    return {} as Pool;
  }

  if (!pool) {
    pool = new Pool({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB,
      ssl: process.env.POSTGRES_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,
    });

    // Log pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }
  return pool;
};

interface QueryOptions {
  query: string;
  params?: any[];
  tenantId?: string;
}

export const executeQuery = async <T>(options: QueryOptions): Promise<T> => {
  // Tarayıcı ortamında çalışırken boş bir dizi döndür
  if (typeof window !== 'undefined') {
    console.warn('PostgreSQL queries are not supported in browser environment');
    return [] as unknown as T;
  }

  const { query, params = [], tenantId } = options;
  const client = await getPool().connect();
  
  try {
    // If tenantId is provided, set the search_path
    if (tenantId) {
      await client.query(`SET search_path TO "${tenantId}",public`);
    }
    
    const result = await client.query(query, params);
    return result.rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper function to execute a transaction with multiple queries
export const executeTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
  tenantId?: string
): Promise<T> => {
  // Tarayıcı ortamında çalışırken boş bir nesne döndür
  if (typeof window !== 'undefined') {
    console.warn('PostgreSQL transactions are not supported in browser environment');
    return {} as T;
  }

  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // If tenantId is provided, set the search_path
    if (tenantId) {
      await client.query(`SET search_path TO "${tenantId}",public`);
    }
    
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};
