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
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created uploads directory:', uploadDir);
      } catch (dirError: any) {
        console.error('Error creating uploads directory:', dirError);
        return res.status(500).json({
          success: false,
          message: 'Could not create uploads directory',
          details: dirError.message
        });
      }
    }

    console.log('Parsing form data...');

    // Parse the form
    const formData: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return reject(err);
        }
        console.log('Form parsed successfully. Fields:', Object.keys(fields), 'Files:', files.file ? 'Yes' : 'No');
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    const entityType = fields.entityType?.[0] || 'temp';
    const entityId = fields.entityId?.[0] || null;
    const createdBy = fields.createdBy?.[0] || null;

    console.log('Form data extracted:', { entityType, entityId, createdBy });

    if (!createdBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Created by is required' 
      });
    }

    // Ensure tenant ID is set for database operations
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };
    
    console.log('Tenant ID set:', req.body.tenantId);

    // Process each file
    const uploadedFiles = [];
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];

    for (const file of fileArray) {
      if (!file) {
        console.log('Skipping undefined file');
        continue;
      }

      console.log('Processing file:', file.originalFilename, 'Size:', file.size, 'Type:', file.mimetype);

      try {
        // Generate a unique filename
        const fileId = uuidv4();
        const fileExt = path.extname(file.originalFilename || '');
        const fileName = `${fileId}${fileExt}`;
        const storagePath = `/uploads/${fileName}`;
        const publicUrl = `/uploads/${fileName}`;

        console.log('Generated file info:', { fileName, storagePath, publicUrl });

        // Move the file to the final location
        const finalPath = path.join(process.cwd(), 'public', storagePath);
        try {
          fs.renameSync(file.filepath, finalPath);
          console.log('File moved to:', finalPath);
        } catch (moveError: any) {
          console.error('Error moving file:', moveError);
          continue; // Skip this file and try the next one
        }

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

        console.log('Executing database query with params:', [
          fileName,
          file.originalFilename,
          file.size,
          file.mimetype,
          storagePath,
          publicUrl,
          entityType,
          entityId,
          createdBy
        ]);

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

        console.log('Database query result:', result);

        if (result.rows && result.rows.length > 0) {
          uploadedFiles.push({
            ...result.rows[0],
            uploadedBy: createdBy
          });
          console.log('File added to uploadedFiles array');
        } else {
          console.warn('No rows returned from database insert');
        }
      } catch (fileError: any) {
        console.error('Error processing file:', file.originalFilename, 'Error:', fileError);
        // Continue processing other files
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
