import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define the directory path for storing mapping files
const MAPPINGS_DIR = path.join(process.cwd(), 'data', 'flow-mappings');
const MAPPING_FILE = path.join(MAPPINGS_DIR, 'flow-company-mapping.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check if mapping file exists
    if (!fs.existsSync(MAPPING_FILE)) {
      return res.status(404).json({
        success: false,
        message: 'No mapping found'
      });
    }

    // Read mapping file
    const mappingContent = fs.readFileSync(MAPPING_FILE, 'utf8');
    const mappingData = JSON.parse(mappingContent);
    
    // Convert the data structure back to the format expected by the frontend
    const mapping = {
      id: mappingData.template?.id || "default-mapping",
      name: mappingData.name || mappingData.template?.name || "Varsayılan Eşleştirme",
      isDefault: mappingData.template?.isDefault || true,
      createdAt: mappingData.template?.createdAt || new Date().toISOString(),
      updatedAt: mappingData.template?.updatedAt || new Date().toISOString(),
      mappings: mappingData.mappings || []
    };
    
    return res.status(200).json({
      success: true,
      mapping
    });
  } catch (error) {
    console.error('Error getting flow company mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting flow company mapping'
    });
  }
}
