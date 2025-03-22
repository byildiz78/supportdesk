import axios from "@/lib/axios";

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
  flow_ba_starting_date?: string;
  flow_ba_end_date?: string;
  flow_ba_notes?: string;
  flow_support_notes?: string;
  flow_licence_notes?: string;
}

export const CompanyService = {
  // Tüm firmaları getir
  getCompanies: async (parentCompanyId?: string): Promise<Company[]> => {
    try {
      const url = parentCompanyId 
        ? `/api/main/companies/getCompanies?parentCompanyId=${parentCompanyId}`
        : '/api/main/companies/getCompanies';
      
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
      const response = await axios.get(`/api/main/companies/getCompanyById?companyId=${companyId}`);
      
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
      const response = await axios.post('/api/main/companies/createUpdateCompany', company);
      
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
      const response = await axios.delete(`/api/main/companies/deleteCompany?companyId=${companyId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Firma silinemedi");
      }
    } catch (error: any) {
      console.error("Firma silinirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Firma silinemedi");
    }
  }
};
