import axios from "axios";
import { User } from "@/types/users";

export const UserService = {
  // Tüm kullanıcıları getir
  getUsers: async (): Promise<User[]> => {
    try {
      console.log('UserService.getUsers çağrıldı');
      const response = await axios.get('/supportdesk/api/main/users/getUsers');
      
      console.log('UserService.getUsers yanıtı:', response.data);
      
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
  createUpdateUser: async (user: Partial<User>, isUpdate: boolean = false): Promise<User> => {
    try {
      console.log(`UserService.${isUpdate ? 'updateUser' : 'createUser'} çağrıldı:`, user);
      
      const response = await axios.post('/supportdesk/api/main/users/createUpdateUser', {
        ...user,
        isUpdate
      });
      
      console.log(`UserService.${isUpdate ? 'updateUser' : 'createUser'} yanıtı:`, response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Kullanıcı ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
      }
    } catch (error: any) {
      console.error(`Kullanıcı ${isUpdate ? 'güncellenirken' : 'oluşturulurken'} hata oluştu:`, error);
      throw new Error(error.response?.data?.message || error.message || `Kullanıcı ${isUpdate ? 'güncellenemedi' : 'oluşturulamadı'}`);
    }
  },

  // Kullanıcı sil
  deleteUser: async (userId: string): Promise<void> => {
    try {
      console.log('UserService.deleteUser çağrıldı, userId:', userId);
      
      const response = await axios.delete(`/supportdesk/api/main/users/deleteUser?userId=${userId}`);
      
      console.log('UserService.deleteUser yanıtı:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Kullanıcı silinemedi");
      }
    } catch (error: any) {
      console.error("Kullanıcı silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kullanıcı silinemedi");
    }
  }
};
