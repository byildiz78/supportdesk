import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/database";

interface ColumnInfo {
  column_name: string;
  data_type: string;
  column_default: string | null;
  is_nullable: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // PostgreSQL'den companies tablosunun kolonlarını getir
    const query = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `;

    const columns = await db.executeQuery<ColumnInfo[]>({
      query,
      req
    });
    
    if (!columns || columns.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: "Firma alanları alınamadı" 
      });
    }

    // Kolon adlarını ve detaylarını ayır
    const fields = columns.map((col: ColumnInfo) => col.column_name);
    
    // Kolon detaylarını içeren bir obje oluştur
    const fieldDetails = columns.reduce((acc: Record<string, any>, col: ColumnInfo) => {
      acc[col.column_name] = {
        type: col.data_type,
        isNullable: col.is_nullable === 'YES',
        hasDefault: col.column_default !== null
      };
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      fields,
      fieldDetails
    });
  } catch (error: unknown) {
    console.error("Error fetching company fields:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Firma alanları alınamadı",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}