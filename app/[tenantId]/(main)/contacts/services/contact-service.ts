import axios from 'axios';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company_id: string;
  company_name?: string;
}

export const ContactService = {
  // Tüm iletişim kişilerini getir
  getContacts: async (): Promise<Contact[]> => {
    try {
      const response = await axios.get('/supportdesk/api/main/contacts/getContacts');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "İletişim kişileri alınamadı");
      }
    } catch (error: any) {
      console.error("İletişim kişileri alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "İletişim kişileri alınamadı");
    }
  },

  // Firmaya ait iletişim kişilerini getir
  getContactsByCompanyId: async (companyId: string): Promise<Contact[]> => {
    try {
      const response = await axios.get(`/supportdesk/api/main/contacts/getContactsByCompanyId?companyId=${companyId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "İletişim kişileri alınamadı");
      }
    } catch (error: any) {
      console.error("İletişim kişileri alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "İletişim kişileri alınamadı");
    }
  },

  // İletişim kişisi detaylarını getir
  getContactById: async (contactId: string): Promise<Contact> => {
    try {
      const response = await axios.get(`/supportdesk/api/main/contacts/getContactById?contactId=${contactId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "İletişim kişisi bilgileri alınamadı");
      }
    } catch (error: any) {
      console.error("İletişim kişisi detayı alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "İletişim kişisi bilgileri alınamadı");
    }
  },

  // İletişim kişisi oluştur veya güncelle
  createUpdateContact: async (contact: Partial<Contact>): Promise<Contact> => {
    try {
      const response = await axios.post('/supportdesk/api/main/contacts/createUpdateContact', contact);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "İletişim kişisi kaydedilemedi");
      }
    } catch (error: any) {
      console.error("İletişim kişisi kaydedilirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "İletişim kişisi kaydedilemedi");
    }
  },

  // İletişim kişisi sil
  deleteContact: async (contactId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/supportdesk/api/main/contacts/deleteContact?contactId=${contactId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "İletişim kişisi silinemedi");
      }
    } catch (error: any) {
      console.error("İletişim kişisi silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "İletişim kişisi silinemedi");
    }
  }
};
