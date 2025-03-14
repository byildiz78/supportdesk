import { NextApiRequest, NextApiResponse } from 'next';
import { ParentCompanyModel } from '@/models/parent-company';

// GET /franchisemanager/api/parent-companies - Tüm ana şirketleri getir
// POST /franchisemanager/api/parent-companies - Yeni ana şirket oluştur
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getParentCompanies(req, res);
    case 'POST':
      return await createParentCompany(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getParentCompanies(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, is_active, limit, offset } = req.query;
    
    const options: any = {};
    
    if (search) {
      options.search = search;
    }
    
    if (is_active !== undefined) {
      options.is_active = is_active === 'true';
    }
    
    if (limit) {
      options.limit = parseInt(limit as string);
    }
    
    if (offset) {
      options.offset = parseInt(offset as string);
    }
    
    const parentCompanies = await ParentCompanyModel.findAll(options);
    const total = await ParentCompanyModel.count(options);
    
    return res.status(200).json({
      data: parentCompanies,
      total,
      limit: options.limit,
      offset: options.offset
    });
  } catch (error: any) {
    console.error('Error fetching parent companies:', error);
    return res.status(500).json({
      error: 'Failed to fetch parent companies',
      details: error.message
    });
  }
}

async function createParentCompany(req: NextApiRequest, res: NextApiResponse) {
  try {
    const companyData = req.body;
    
    if (!companyData.name) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    // Aynı isimde şirket var mı kontrol et
    const existingCompany = await ParentCompanyModel.findByName(companyData.name);
    if (existingCompany) {
      return res.status(409).json({ error: 'A company with this name already exists' });
    }
    
    const newCompany = await ParentCompanyModel.create(companyData);
    
    return res.status(201).json(newCompany);
  } catch (error: any) {
    console.error('Error creating parent company:', error);
    return res.status(500).json({
      error: 'Failed to create parent company',
      details: error.message
    });
  }
}
