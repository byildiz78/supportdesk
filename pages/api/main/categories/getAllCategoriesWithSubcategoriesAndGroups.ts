import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  subcategoryId: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  mesaiSaatleriSla: number;
  mesaiDisiSla: number;
  haftaSonuMesaiSla: number;
  haftaSonuMesaiDisiSla: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Veritabanı sorgusu - tenant ID'yi req.body içine ekliyoruz
    req.body = {
      ...req.body,
      tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
    };

    // 1. Kategorileri getir
    const categoriesQuery = `
      SELECT 
        id, 
        name, 
        description,
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM categories
      WHERE is_deleted = false
      ORDER BY name ASC
    `;

    const categories = await db.executeQuery<Category[]>({
      query: categoriesQuery,
      params: [],
      req
    });

    // 2. Alt kategorileri getir
    const subcategoriesQuery = `
      SELECT 
        id, 
        name, 
        description,
        category_id as "categoryId",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM subcategories
      WHERE is_deleted = false
      ORDER BY name ASC
    `;

    const allSubcategories = await db.executeQuery<Subcategory[]>({
      query: subcategoriesQuery,
      params: [],
      req
    });

    // 3. Grupları getir
    const groupsQuery = `
      SELECT 
        id, 
        name, 
        description,
        subcategory_id as "subcategoryId",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy",
        mesai_saatleri_sla as "mesaiSaatleriSla",
        mesai_disi_sla as "mesaiDisiSla",
        hafta_sonu_mesai_sla as "haftaSonuMesaiSla",
        hafta_sonu_mesai_disi_sla as "haftaSonuMesaiDisiSla",
        sla_next_day_start as "slaNextDayStart"
      FROM groups
      WHERE is_deleted = false
      ORDER BY name ASC
    `;

    const allGroups = await db.executeQuery<Group[]>({
      query: groupsQuery,
      params: [],
      req
    });

    // Verileri istenilen formata dönüştür
    const subcategoriesMap: Record<string, Subcategory[]> = {};
    const groupsMap: Record<string, Group[]> = {};

    // Alt kategorileri kategorilere göre grupla
    allSubcategories.forEach(subcategory => {
      if (!subcategoriesMap[subcategory.categoryId]) {
        subcategoriesMap[subcategory.categoryId] = [];
      }
      subcategoriesMap[subcategory.categoryId].push(subcategory);
    });

    // Grupları alt kategorilere göre grupla
    allGroups.forEach(group => {
      if (!groupsMap[group.subcategoryId]) {
        groupsMap[group.subcategoryId] = [];
      }
      groupsMap[group.subcategoryId].push(group);
    });

    return res.status(200).json({
      success: true,
      data: {
        categories,
        subcategories: subcategoriesMap,
        groups: groupsMap
      }
    });
  } catch (error: any) {
    console.error('Kategoriler alınırken hata oluştu:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Kategoriler alınırken bir hata oluştu',
      details: error.message
    });
  }
}
