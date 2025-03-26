import { NextApiRequest } from 'next';
import { executeQuery, executeQueryResult, executeTransaction } from './postgres';
import { extractTenantFromBody, extractTenantId } from './utils';

interface DatabaseQueryOptions {
  query: string;
  params?: any[];
  req: NextApiRequest;
}

export class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Execute a SQL query with proper tenant context
   * @param options Query options including the SQL query, parameters, and request object
   * @returns Query result
   */
  public async executeQuery<T>(options: DatabaseQueryOptions): Promise<T> {
    const { query, params = [], req } = options;
    
    // Extract tenant ID from request
    let tenantId = req.body?.tenantId;
    tenantId = extractTenantFromBody(req) || extractTenantId(req.headers.referer);
    
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    // Execute the query with the tenant context
    return executeQuery<T>({
      query,
      params,
      tenantId
    });
  }

    /**
   * Execute a SQL query with proper tenant context
   * @param options Query options including the SQL query, parameters, and request object
   * @returns Query result
   */
    public async executeQueryResult<T>(options: DatabaseQueryOptions): Promise<T> {
      const { query, params = [], req } = options;
      
      // Extract tenant ID from request
      let tenantId = req.body?.tenantId;
      tenantId = extractTenantFromBody(req) || extractTenantId(req.headers.referer);
      
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }
      
      // Execute the query with the tenant context
      return executeQueryResult<T>({
        query,
        params,
        tenantId
      });
    }

  /**
   * Execute a transaction with multiple queries
   * @param req Request object to extract tenant ID
   * @param callback Function that receives a client to execute multiple queries
   * @returns Transaction result
   */
  public async executeTransaction<T>(
    req: NextApiRequest,
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    // Extract tenant ID from request
    let tenantId = req.body?.tenantId;
    tenantId = extractTenantFromBody(req) || extractTenantId(req.headers.referer);
    
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    // Execute the transaction with the tenant context
    return executeTransaction<T>(callback, tenantId);
  }
}

// Export a singleton instance for convenience
export const db = Database.getInstance();
