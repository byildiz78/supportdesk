import axios from "@/lib/axios";
import { User } from "@/types/users";

export const UserService = {
  // Tüm kullanıcıları getir
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get('/api/main/users/getUsers');
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Kullanıcılar alınamadı");
      }
    } catch (error: any) {
      console.error("Kullanıcılar alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kullanıcılar alınamadı");
    }
  },

  // Kullanıcı oluştur veya güncelle
  createUpdateUser: async (user: Partial<User>, isUpdate: boolean = false): Promise<{
    success: boolean;
    message?: string;
    details?: string;
    data?: User;
  }> => {
    try {
      const response = await axios.post('/api/main/users/createUpdateUser', {
        ...user,
        isUpdate
      });
      
      return {
        success: response.data.success,
        message: response.data.message,
        details: response.data.details,
        data: response.data.data
      };
    } catch (error: any) {
      console.error(`Kullanıcı ${isUpdate ? 'güncellenirken' : 'oluşturulurken'} hata oluştu:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || `Kullanıcı ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`,
        details: error.response?.data?.details
      };
    }
  },

  // Kullanıcı sil
  deleteUser: async (userId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/api/main/users/deleteUser?userId=${userId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Kullanıcı silinemedi");
      }
    } catch (error: any) {
      console.error("Kullanıcı silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kullanıcı silinemedi");
    }
  }
}
