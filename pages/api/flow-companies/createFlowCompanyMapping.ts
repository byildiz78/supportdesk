import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define the directory path for storing mapping files
const MAPPINGS_DIR = path.join(process.cwd(), 'data', 'flow-mappings');
const MAPPING_FILE = path.join(MAPPINGS_DIR, 'flow-company-mapping.json');

// Ensure the directory exists
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Extract mapping data from request body
    const { mapping } = req.body;

    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Mapping data is required' });
    }

    // Generate a unique ID if not provided
    if (!mapping.id) {
      mapping.id = Date.now().toString();
    }

    // Update timestamps
    mapping.createdAt = mapping.createdAt || new Date().toISOString();
    mapping.updatedAt = new Date().toISOString();

    // Ensure directory exists
    ensureDirectoryExists(MAPPINGS_DIR);

    // Create the JSON structure
    const mappingData = {
      // Template information
      template: {
        id: mapping.id,
        name: mapping.name,
        isDefault: mapping.isDefault,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt,
      },
      // Mapping details
      mappings: mapping.mappings.map((m: any) => ({
        sourceField: m.sourceField,
        targetField: m.targetField,
        description: m.description
      }))
    };

    // Write mapping to file
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappingData, null, 2), 'utf8');

    return res.status(200).json({
      success: true,
      message: 'Flow company mapping created successfully',
      mapping
    });
  } catch (error) {
    console.error('Error creating flow company mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating flow company mapping'
    });
  }
}
