import { NextApiRequest, NextApiResponse } from 'next';
import { ParentCompanyModel } from '@/models/parent-company';

// GET /franchisemanager/api/parent-companies/[id] - Belirli bir ana şirketi getir
// PUT /franchisemanager/api/parent-companies/[id] - Ana şirketi güncelle
// DELETE /franchisemanager/api/parent-companies/[id] - Ana şirketi sil
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid parent company ID' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getParentCompany(id, res);
    case 'PUT':
      return await updateParentCompany(id, req, res);
    case 'DELETE':
      return await deleteParentCompany(id, req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getParentCompany(id: string, res: NextApiResponse) {
  try {
    const parentCompany = await ParentCompanyModel.findById(id);
    
    if (!parentCompany) {
      return res.status(404).json({ error: 'Parent company not found' });
    }
    
    return res.status(200).json(parentCompany);
  } catch (error: any) {
    console.error('Error fetching parent company:', error);
    return res.status(500).json({
      error: 'Failed to fetch parent company',
      details: error.message
    });
  }
}

async function updateParentCompany(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const companyData = req.body;
    
    // Şirketin var olup olmadığını kontrol et
    const existingCompany = await ParentCompanyModel.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ error: 'Parent company not found' });
    }
    
    // Aynı isimde başka bir şirket var mı kontrol et
    if (companyData.name && companyData.name !== existingCompany.name) {
      const duplicateCompany = await ParentCompanyModel.findByName(companyData.name);
      if (duplicateCompany && duplicateCompany.id !== id) {
        return res.status(409).json({ error: 'Another company with this name already exists' });
      }
    }
    
    const updatedCompany = await ParentCompanyModel.update(id, companyData);
    
    return res.status(200).json(updatedCompany);
  } catch (error: any) {
    console.error('Error updating parent company:', error);
    return res.status(500).json({
      error: 'Failed to update parent company',
      details: error.message
    });
  }
}

async function deleteParentCompany(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Şirketin var olup olmadığını kontrol et
    const existingCompany = await ParentCompanyModel.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ error: 'Parent company not found' });
    }
    
    const { deleted_by } = req.body || { deleted_by: 'system' };
    
    await ParentCompanyModel.delete(id, deleted_by);
    
    return res.status(200).json({ success: true, message: 'Parent company deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting parent company:', error);
    return res.status(500).json({
      error: 'Failed to delete parent company',
      details: error.message
    });
  }
}
