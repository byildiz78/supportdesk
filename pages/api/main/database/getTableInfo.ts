import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { tableName } = req.query;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Table name is required'
      });
    }

    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // Tablo yapısını sorgula
    const tableInfoQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;

    const tableInfoResult = await db.executeQuery<TableColumn[]>({
      query: tableInfoQuery,
      params: [tableName],
      req
    });

    // Tablo verilerini örnek olarak getir
    const tableDataQuery = `
      SELECT * FROM ${tableName} LIMIT 1;
    `;

    let tableDataResult: any[] = [];
    try {
      const result = await db.executeQuery<any[]>({
        query: tableDataQuery,
        params: [],
        req
      });
      tableDataResult = result || [];
    } catch (error) {
      console.error('Tablo verisi alınamadı:', error);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        structure: tableInfoResult || [],
        sampleData: tableDataResult
      }
    });
  } catch (error: any) {
    console.error('Get table info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Tablo bilgileri alınırken bir hata oluştu',
      details: error.message
    });
  }
}
