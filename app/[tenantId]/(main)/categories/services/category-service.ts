import axios from "@/lib/axios";
import { Category, Subcategory, Group } from "@/types/categories";

export const CategoryService = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await axios.get('/api/main/categories/getCategories');
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Kategoriler alınamadı");
      }
    } catch (error: any) {
      console.error("Kategoriler alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kategoriler alınamadı");
    }
  },

  createUpdateCategory: async (category: Partial<Category>, isUpdate: boolean = false): Promise<Category> => {
    try {
      const response = await axios.post('/api/main/categories/createUpdateCategory', {
        ...category,
        isUpdate
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Kategori ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
      }
    } catch (error: any) {
      console.error(`Kategori ${isUpdate ? 'güncellenirken' : 'oluşturulurken'} hata oluştu:`, error);
      throw new Error(error.response?.data?.message || error.message || `Kategori ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
    }
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/api/main/categories/deleteCategory?categoryId=${categoryId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Kategori silinemedi");
      }
    } catch (error: any) {
      console.error("Kategori silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kategori silinemedi");
    }
  },

  // Subcategories
  getSubcategories: async (categoryId: string): Promise<Subcategory[]> => {
    try {
      const response = await axios.get(`/api/main/categories/getSubcategories?categoryId=${categoryId}`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Alt kategoriler alınamadı");
      }
    } catch (error: any) {
      console.error("Alt kategoriler alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Alt kategoriler alınamadı");
    }
  },

  createUpdateSubcategory: async (subcategory: Partial<Subcategory>, isUpdate: boolean = false): Promise<Subcategory> => {
    try {
      
      const response = await axios.post('/api/main/categories/createUpdateSubcategory', {
        ...subcategory,
        isUpdate
      });
      
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Alt kategori ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
      }
    } catch (error: any) {
      console.error(`Alt kategori ${isUpdate ? 'güncellenirken' : 'oluşturulurken'} hata oluştu:`, error);
      throw new Error(error.response?.data?.message || error.message || `Alt kategori ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
    }
  },

  deleteSubcategory: async (subcategoryId: string): Promise<void> => {
    try {
      
      const response = await axios.delete(`/api/main/categories/deleteSubcategory?subcategoryId=${subcategoryId}`);
      
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Alt kategori silinemedi");
      }
    } catch (error: any) {
      console.error("Alt kategori silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Alt kategori silinemedi");
    }
  },

  // Groups
  getGroups: async (subcategoryId: string): Promise<Group[]> => {
    try {
      const response = await axios.get(`/api/main/categories/getGroups?subcategoryId=${subcategoryId}`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Gruplar alınamadı");
      }
    } catch (error: any) {
      console.error("Gruplar alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Gruplar alınamadı");
    }
  },

  createUpdateGroup: async (group: Partial<Group>, isUpdate: boolean = false): Promise<Group> => {
    try {
      const response = await axios.post('/api/main/categories/createUpdateGroup', {
        ...group,
        isUpdate
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Grup ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
      }
    } catch (error: any) {
      console.error(`Grup ${isUpdate ? 'güncellenirken' : 'oluşturulurken'} hata oluştu:`, error);
      throw new Error(error.response?.data?.message || error.message || `Grup ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
    }
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/api/main/categories/deleteGroup?groupId=${groupId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Grup silinemedi");
      }
    } catch (error: any) {
      console.error("Grup silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Grup silinemedi");
    }
  }
};
