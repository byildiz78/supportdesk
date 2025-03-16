import axios from 'axios';

export interface Company {
  id: string;
  name: string;
  parent_company_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  tax_office?: string;
}

export const CompanyService = {
  // Tüm firmaları getir
  getCompanies: async (parentCompanyId?: string): Promise<Company[]> => {
    try {
      const url = parentCompanyId 
        ? `/supportdesk/api/main/companies/getCompanies?parentCompanyId=${parentCompanyId}`
        : '/supportdesk/api/main/companies/getCompanies';
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Firmalar alınamadı");
      }
    } catch (error: any) {
      console.error("Firmalar alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Firmalar alınamadı");
    }
  },

  // Firma detaylarını getir
  getCompanyById: async (companyId: string): Promise<Company> => {
    try {
      const response = await axios.get(`/supportdesk/api/main/companies/getCompanyById?companyId=${companyId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Firma bilgileri alınamadı");
      }
    } catch (error: any) {
      console.error("Firma detayı alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Firma bilgileri alınamadı");
    }
  },

  // Firma oluştur veya güncelle
  createUpdateCompany: async (company: Partial<Company>): Promise<Company> => {
    try {
      const response = await axios.post('/supportdesk/api/main/companies/createUpdateCompany', company);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Firma kaydedilemedi");
      }
    } catch (error: any) {
      console.error("Firma kaydedilirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Firma kaydedilemedi");
    }
  },

  // Firma sil
  deleteCompany: async (companyId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/supportdesk/api/main/companies/deleteCompany?companyId=${companyId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Firma silinemedi");
      }
    } catch (error: any) {
      console.error("Firma silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Firma silinemedi");
    }
  }
};
