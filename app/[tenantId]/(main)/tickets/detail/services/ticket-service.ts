import axios from "axios";
import { Ticket, Company, Contact } from "../types";

export const TicketService = {
  // Bilet detaylarını getir
  getTicketById: async (ticketId: string): Promise<Ticket> => {
    try {
      console.log('getTicketById çağrıldı, ticketId:', ticketId);
      const response = await axios.get(`/supportdesk/api/main/tickets/getTicketById?ticketId=${ticketId}`);
      
      console.log('getTicketById API yanıtı:', response.data);
      
      if (response.data.success) {
        // API'den dönen veriyi güvenli bir şekilde işle
        const ticket = response.data.data || {};
        console.log('Alınan bilet:', ticket);
        console.log('Bilet yorumları:', ticket.comments);
        
        // Eksik alanları varsayılan değerlerle doldur
        return {
          id: ticket.id || "",
          title: ticket.title || "",
          description: ticket.description || "",
          status: ticket.status || "open",
          priority: ticket.priority || "medium",
          category_id: ticket.category_id || null,
          subcategory_id: ticket.subcategory_id || null,
          company_id: ticket.company_id || null,
          company_name: ticket.company_name || null,
          contact_id: ticket.contact_id || null,
          customer_name: ticket.customer_name || null,
          customer_email: ticket.customer_email || null,
          customer_phone: ticket.customer_phone || null,
          contact_position: ticket.contact_position || null,
          assigned_to: ticket.assigned_to || null,
          assignedTo: ticket.assignedTo || null,
          created_by: ticket.created_by || null,
          created_at: ticket.created_at || new Date().toISOString(),
          updated_at: ticket.updated_at || null,
          due_date: ticket.due_date || null,
          comments: ticket.comments || [],
          attachments: ticket.attachments || [],
          // Ek alanlar
          ...ticket
        };
      } else {
        throw new Error(response.data.message || "Bilet bilgileri alınamadı");
      }
    } catch (error: any) {
      console.error("Bilet detayı alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Bilet bilgileri alınamadı");
    }
  },

  // Bilet güncelle
  updateTicket: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    try {
      // Extract isUpdate from the ticket object and remove it before sending to API
      const { isUpdate, ...ticketData } = ticket as any;
      
      // Ensure assigned_to is properly mapped to assignedTo for the API
      if (ticketData.assigned_to && !ticketData.assignedTo) {
        ticketData.assignedTo = ticketData.assigned_to;
      }
      
      const response = await axios.post("/supportdesk/api/main/tickets/createUpdateTicket", {
        ...ticketData,
        isUpdate: true
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Bilet güncellenemedi");
      }
    } catch (error: any) {
      console.error("Bilet güncellenirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Bilet güncellenemedi");
    }
  },

  // Yorum ekle
  addComment: async (comment: any): Promise<any> => {
    try {
      console.log('addComment çağrıldı, yorum:', comment);
      const response = await axios.post("/supportdesk/api/main/tickets/addTicketComment", comment);
      
      console.log('addComment API yanıtı:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Yorum eklenemedi");
      }
    } catch (error: any) {
      console.error("Yorum eklenirken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Yorum eklenemedi");
    }
  }
};

export const CompanyService = {
  // Tüm firmaları getir
  getCompanies: async (): Promise<Company[]> => {
    try {
      const response = await axios.get("/supportdesk/api/main/companies/getCompanies");
      
      if (response.data.success) {
        return response.data.data || [];
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
  }
};

export const ContactService = {
  // Tüm kişileri getir
  getAllContacts: async (): Promise<Contact[]> => {
    try {
      const response = await axios.get("/supportdesk/api/main/contacts/getContacts");
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Kişiler alınamadı");
      }
    } catch (error: any) {
      console.error("Kişiler alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kişiler alınamadı");
    }
  },

  // Firmaya ait kişileri getir
  getContactsByCompanyId: async (companyId: string): Promise<Contact[]> => {
    try {
      const response = await axios.get(`/supportdesk/api/main/contacts/getContactsByCompanyId?companyId=${companyId}`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Kişiler alınamadı");
      }
    } catch (error: any) {
      console.error("Kişiler alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kişiler alınamadı");
    }
  },

  // Kişi detaylarını getir
  getContactById: async (contactId: string): Promise<Contact> => {
    try {
      const response = await axios.get(`/supportdesk/api/main/contacts/getContactById?contactId=${contactId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Kişi bilgileri alınamadı");
      }
    } catch (error: any) {
      console.error("Kişi detayı alınırken hata oluştu:", error);
      throw new Error(error.response?.data?.message || error.message || "Kişi bilgileri alınamadı");
    }
  }
};
