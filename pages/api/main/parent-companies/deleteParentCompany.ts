import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;
    const tenantId = extractTenantFromBody(req);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Ana şirket ID\'si gerekli' });
    }

    // Önce bu ana şirkete bağlı şirketler var mı kontrol et
    const checkDependenciesQuery = `
      SELECT COUNT(*) as count
      FROM companies
      WHERE parent_company_id = $1 AND is_deleted = false
    `;

    const dependenciesResult = await db.executeQuery<{ count: number }[]>({
      query: checkDependenciesQuery,
      params: [id],
      req
    });

    if (dependenciesResult && dependenciesResult[0]?.count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu ana şirkete bağlı şirketler var. Önce bağlı şirketleri silmelisiniz.' 
      });
    }

    // Soft delete işlemi
    const deleteQuery = `
      UPDATE parent_companies
      SET 
        is_deleted = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id;
    `;

    const result = await db.executeQuery<DbResult[]>({
      query: deleteQuery,
      params: [id],
      req
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Ana şirket bulunamadı' });
    }

    return res.status(200).json({ success: true, message: 'Ana şirket başarıyla silindi' });
  } catch (error: any) {
    console.error('Delete parent company API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      details: error.message 
    });
  }
}
