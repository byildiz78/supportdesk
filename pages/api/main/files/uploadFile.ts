import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';
import { saveFile } from '@/lib/saveFile';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface QueryResult {
  rows: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let entityType = 'temp';
  let entityId: string | null = null;
  let createdBy: string | null = null;
  let basePath = process.env.NEXT_PUBLIC_BASEPATH || '';

  try {
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    
    entityType = fields.entityType?.[0] || 'temp';
    entityId = fields.entityId?.[0] || null;
    createdBy = fields.createdBy?.[0] || null;
    basePath = process.env.NEXT_PUBLIC_BASEPATH || '';

    // Tenant ID'yi req.body'ye ekle (veritabanı işlemleri için gerekli)
    req.body = {
      ...req.body || {},
      tenantId: req.headers['x-tenant-id'] || 'public'
    };

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Created by is required'
      });
    }

    // Process each file
    const uploadedFiles = [];

    // files veya files.file tanımsız olabilir, güvenli bir şekilde kontrol et
    if (!files || !files.file) {
      return res.status(200).json({
        success: true,
        message: 'No files to upload',
        files: []
      });
    }

    const fileArray = Array.isArray(files.file) ? files.file : [files.file];

    // Dosya dizisi boş olabilir
    if (fileArray.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No files to upload',
        files: []
      });
    }

    for (const file of fileArray) {
      if (!file) continue;

      // Generate a unique filename
      const fileId = uuidv4();
      const fileExt = path.extname(file.originalFilename || '');
      const fileName = `${fileId}${fileExt}`;

      // Move the file to the final location
      const finalPath = await saveFile(file, fileName);

      // Insert file info into database
      const insertQuery = `
        INSERT INTO attachments (
          name,
          original_filename,
          size,
          mime_type,
          storage_path,
          public_url,
          entity_type,
          entity_id,
          created_at,
          created_by,
          updated_at,
          is_deleted
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, CURRENT_TIMESTAMP, false
        )
        RETURNING id, name, original_filename as "originalFilename", size, mime_type as "mimeType", 
                 public_url as "url", created_at as "uploadedAt";
      `;

      // Veritabanı sonucu için değişken
      let dbResult: any = null;

      try {
        const result = await db.executeQuery<QueryResult>({
          query: insertQuery,
          params: [
            fileName,
            file.originalFilename,
            file.size,
            file.mimetype,
            finalPath,
            finalPath,
            entityType,
            entityId,
            createdBy
          ],
          req
        });

        dbResult = result;

        // result veya result.rows undefined olabilir, güvenli bir şekilde kontrol et
        if (result && result.rows && result.rows.length > 0) {
          uploadedFiles.push({
            ...result.rows[0],
            uploadedBy: createdBy
          });
        } else {
          console.error('Database query did not return any rows');
        }
      } catch (dbError: any) {
        console.error('Veritabanı sorgusu hatası:', dbError);
        console.error('Hata detayları:', dbError.message);
        if (dbError.detail) console.error('DB Hata detayı:', dbError.detail);
        if (dbError.code) console.error('DB Hata kodu:', dbError.code);
        if (dbError.stack) console.error('DB Hata stack:', dbError.stack);
      }

      // Veritabanına kaydedilemese bile, dosya bilgilerini döndür
      uploadedFiles.push({
        id: dbResult && dbResult.rows && dbResult.rows.length > 0 ? dbResult.rows[0].id : uuidv4(), // Geçici bir ID oluştur
        name: fileName,
        originalFilename: file.originalFilename,
        size: file.size,
        mimeType: file.mimetype,
        url: finalPath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: createdBy
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      metadata: {
        entityType,
        entityId,
        createdBy,
        basePath
      }
    });
  } catch (error: any) {
    console.error('File upload error:', error);

    // Hata detaylarını daha ayrıntılı logla
    if (error.code) console.error('Error code:', error.code);
    if (error.stack) console.error('Error stack:', error.stack);

    // Veritabanı hatası mı kontrol et
    if (error.message && error.message.includes('database')) {
      console.error('Database error details:', error.detail || 'No additional details');
    }

    // Dosya sistemi hatası mı kontrol et
    if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
      console.error('File system error. Check permissions and paths.');
    }

    return res.status(500).json({
      success: false,
      message: 'Error uploading files',
      details: error.message,
      code: error.code || 'UNKNOWN',
      metadata: {
        entityType: entityType,
        entityId: entityId,
        createdBy: createdBy,
        basePath: basePath
      }
    });
  }
}
