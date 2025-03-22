"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';
import { usePathname } from 'next/navigation';
import { Category, Subcategory, Group } from '@/types/categories';

interface CategoriesContextType {
  categories: Category[];
  subcategories: Record<string, Subcategory[]>; // categoryId -> subcategories
  groups: Record<string, Group[]>; // subcategoryId -> groups
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  getSubcategoriesByCategoryId: (categoryId: string) => Subcategory[];
  getGroupsBySubcategoryId: (subcategoryId: string) => Group[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  addSubcategory: (subcategory: Subcategory) => void;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (groupId: string) => void;
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
      
      // Tek bir API çağrısı ile tüm verileri al
      const response = await axios.get('/api/main/categories/getAllCategoriesWithSubcategoriesAndGroups');
      
      if (response.data.success) {
        const { categories: fetchedCategories, subcategories: fetchedSubcategories, groups: fetchedGroups } = response.data.data;
        
        // Verileri state'e kaydet
        setCategories(fetchedCategories);
        setSubcategories(fetchedSubcategories);
        setGroups(fetchedGroups);
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

  // Yerel state'i güncelleyen fonksiyonlar
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    
    // İlgili alt kategorileri ve grupları da temizle
    const categorySubcategories = subcategories[categoryId] || [];
    const subcategoryIds = categorySubcategories.map(s => s.id);
    
    // Alt kategorileri sil
    setSubcategories(prev => {
      const newSubcategories = { ...prev };
      delete newSubcategories[categoryId];
      return newSubcategories;
    });
    
    // İlgili grupları sil
    setGroups(prev => {
      const newGroups = { ...prev };
      subcategoryIds.forEach(id => {
        delete newGroups[id];
      });
      return newGroups;
    });
  };

  const addSubcategory = (subcategory: Subcategory) => {
    setSubcategories(prev => {
      const newSubcategories = { ...prev };
      const categoryId = subcategory.categoryId;
      newSubcategories[categoryId] = [...(newSubcategories[categoryId] || []), subcategory];
      return newSubcategories;
    });
  };

  const updateSubcategory = (subcategory: Subcategory) => {
    setSubcategories(prev => {
      const newSubcategories = { ...prev };
      const categoryId = subcategory.categoryId;
      if (newSubcategories[categoryId]) {
        newSubcategories[categoryId] = newSubcategories[categoryId].map(s => 
          s.id === subcategory.id ? subcategory : s
        );
      }
      return newSubcategories;
    });
  };

  const deleteSubcategory = (subcategoryId: string) => {
    // Önce hangi kategoriye ait olduğunu bul
    let categoryId = '';
    for (const [catId, subs] of Object.entries(subcategories)) {
      if (subs.some(s => s.id === subcategoryId)) {
        categoryId = catId;
        break;
      }
    }
    
    if (categoryId) {
      // Alt kategoriyi sil
      setSubcategories(prev => {
        const newSubcategories = { ...prev };
        newSubcategories[categoryId] = newSubcategories[categoryId].filter(s => s.id !== subcategoryId);
        return newSubcategories;
      });
      
      // İlgili grupları sil
      setGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[subcategoryId];
        return newGroups;
      });
    }
  };

  const addGroup = (group: Group) => {
    setGroups(prev => {
      const newGroups = { ...prev };
      const subcategoryId = group.subcategoryId;
      newGroups[subcategoryId] = [...(newGroups[subcategoryId] || []), group];
      return newGroups;
    });
  };

  const updateGroup = (group: Group) => {
    setGroups(prev => {
      const newGroups = { ...prev };
      const subcategoryId = group.subcategoryId;
      if (newGroups[subcategoryId]) {
        newGroups[subcategoryId] = newGroups[subcategoryId].map(g => 
          g.id === group.id ? group : g
        );
      }
      return newGroups;
    });
  };

  const deleteGroup = (groupId: string) => {
    // Önce hangi alt kategoriye ait olduğunu bul
    let subcategoryId = '';
    for (const [subId, grps] of Object.entries(groups)) {
      if (grps.some(g => g.id === groupId)) {
        subcategoryId = subId;
        break;
      }
    }
    
    if (subcategoryId) {
      // Grubu sil
      setGroups(prev => {
        const newGroups = { ...prev };
        newGroups[subcategoryId] = newGroups[subcategoryId].filter(g => g.id !== groupId);
        return newGroups;
      });
    }
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
        getGroupsBySubcategoryId,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        addGroup,
        updateGroup,
        deleteGroup
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

// Tip tanımlamalarını yeniden dışa aktar
export type { Category, Subcategory, Group };
