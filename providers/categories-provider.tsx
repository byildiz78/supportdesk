"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';
import { usePathname } from 'next/navigation';

// Tip tanımlamaları
export interface Category {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId?: string;
  description?: string;
  [key: string]: any;
}

export interface Group {
  id: string;
  name: string;
  subcategoryId?: string;
  description?: string;
  [key: string]: any;
}

interface CategoriesContextType {
  categories: Category[];
  subcategories: Record<string, Subcategory[]>; // categoryId -> subcategories
  groups: Record<string, Group[]>; // subcategoryId -> groups
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  getSubcategoriesByCategoryId: (categoryId: string) => Subcategory[];
  getGroupsBySubcategoryId: (subcategoryId: string) => Group[];
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [groups, setGroups] = useState<Record<string, Group[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  const tenantId = pathname?.split('/')[1] || '';

  const fetchCategories = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Kategorileri getir
      const categoriesResponse = await axios.get('/api/main/categories/getCategories');
      if (categoriesResponse.data.success) {
        const fetchedCategories = categoriesResponse.data.data;
        setCategories(fetchedCategories);
        
        // Her kategori için alt kategorileri getir
        const subcategoriesMap: Record<string, Subcategory[]> = {};
        const groupsMap: Record<string, Group[]> = {};
        
        for (const category of fetchedCategories) {
          try {
            const subcategoriesResponse = await axios.get(`/api/main/categories/getSubcategories?categoryId=${category.id}`);
            if (subcategoriesResponse.data.success) {
              const fetchedSubcategories = subcategoriesResponse.data.data;
              subcategoriesMap[category.id] = fetchedSubcategories;
              
              // Her alt kategori için grupları getir
              for (const subcategory of fetchedSubcategories) {
                try {
                  const groupsResponse = await axios.get(`/api/main/categories/getGroups?subcategoryId=${subcategory.id}`);
                  if (groupsResponse.data.success) {
                    groupsMap[subcategory.id] = groupsResponse.data.data;
                  }
                } catch (error) {
                  console.error(`Grup verileri alınırken hata: subcategoryId=${subcategory.id}`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Alt kategori verileri alınırken hata: categoryId=${category.id}`, error);
          }
        }
        
        setSubcategories(subcategoriesMap);
        setGroups(groupsMap);
      } else {
        setError('Kategoriler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Kategoriler yüklenirken hata oluştu:', err);
      setError('Kategoriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchCategories();
    }
  }, [tenantId]);

  const refreshCategories = async () => {
    await fetchCategories();
  };

  const getSubcategoriesByCategoryId = (categoryId: string): Subcategory[] => {
    return subcategories[categoryId] || [];
  };

  const getGroupsBySubcategoryId = (subcategoryId: string): Group[] => {
    return groups[subcategoryId] || [];
  };

  return (
    <CategoriesContext.Provider 
      value={{ 
        categories, 
        subcategories, 
        groups, 
        loading, 
        error, 
        refreshCategories,
        getSubcategoriesByCategoryId,
        getGroupsBySubcategoryId
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
