import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';

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

  try {
    // Parse the form data
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), 'public/uploads'),
    });

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse the form
    const formData: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    const entityType = fields.entityType?.[0] || 'temp';
    const entityId = fields.entityId?.[0] || null;
    const createdBy = fields.createdBy?.[0] || null;

    if (!createdBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Created by is required' 
      });
    }

    // Process each file
    const uploadedFiles = [];
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];

    for (const file of fileArray) {
      if (!file) continue;

      // Generate a unique filename
      const fileId = uuidv4();
      const fileExt = path.extname(file.originalFilename || '');
      const fileName = `${fileId}${fileExt}`;
      const storagePath = `/uploads/${fileName}`;
      const publicUrl = `/uploads/${fileName}`;

      // Move the file to the final location
      const finalPath = path.join(process.cwd(), 'public', storagePath);
      fs.renameSync(file.filepath, finalPath);

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

      const result = await db.executeQuery<QueryResult>({
        query: insertQuery,
        params: [
          fileName,
          file.originalFilename,
          file.size,
          file.mimetype,
          storagePath,
          publicUrl,
          entityType,
          entityId,
          createdBy
        ],
        req
      });

      if (result.rows.length > 0) {
        uploadedFiles.push({
          ...result.rows[0],
          uploadedBy: createdBy
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading files',
      details: error.message
    });
  }
}
