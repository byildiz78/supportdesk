import axios from "@/lib/axios";
import { Ticket, Company, Tag } from "../types";
import { getUserId } from '@/utils/user-utils';

export const TicketService = {
  // Bilet detaylarını getir
  getTicketById: async (ticketId: string): Promise<Ticket> => {
    try {
      const response = await axios.get(`/api/main/tickets/getTicketById?ticketId=${ticketId}`);
      
      if (response.data.success) {
        // API'den dönen veriyi güvenli bir şekilde işle
        const ticket = response.data.data || {};
        
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
          // Müşteri bilgileri - hem customer hem de contact alanlarını kontrol et
          customer_name: ticket.customer_name || null,
          customer_email: ticket.customer_email || null,
          customer_phone: ticket.customer_phone || null,
          // Contact bilgileri
          contact_name: ticket.contact_name || null,
          contact_first_name: ticket.contact_first_name || null,
          contact_last_name: ticket.contact_last_name || null,
          contact_email: ticket.contact_email || null,
          contact_phone: ticket.contact_phone || null,
          contact_position: ticket.contact_position || null,
          // Diğer alanlar
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
      throw error;
    }
  },

  // Bilet güncelle
  updateTicket: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    try {
      // Status, priority ve company alanlarının doğru değerlere sahip olduğundan emin olalım
      const ticketToUpdate = {
        ...ticket,
        // Status ve priority alanlarını kontrol et ve varsayılan değerleri kullan
        status: ['open', 'in_progress', 'waiting', 'pending', 'resolved', 'closed'].includes(ticket.status || '') ? ticket.status : 'open',
        priority: ticket.priority || 'medium',
        // Company alanlarını özellikle belirt
        company_id: ticket.company_id,
        company_name: ticket.company_name
      };
      const response = await axios.post('/api/main/tickets/updateTicket', ticketToUpdate);
      
      if (response.data.success) {
        // API'den dönen veriyi güvenli bir şekilde işle
        const updatedTicket = response.data.data || {};
        
        // Eksik alanları varsayılan değerlerle doldur
        return {
          id: updatedTicket.id || ticket.id || "",
          title: updatedTicket.title || ticket.title || "",
          description: updatedTicket.description || ticket.description || "",
          status: updatedTicket.status || ticket.status || "open",
          priority: updatedTicket.priority || ticket.priority || "medium",
          category_id: updatedTicket.category_id || ticket.category_id || null,
          subcategory_id: updatedTicket.subcategory_id || ticket.subcategory_id || null,
          company_id: updatedTicket.company_id || ticket.company_id || null,
          company_name: updatedTicket.company_name || ticket.company_name || null,
          contact_id: updatedTicket.contact_id || ticket.contact_id || null,
          customer_name: updatedTicket.customer_name || ticket.customer_name || null,
          customer_email: updatedTicket.customer_email || ticket.customer_email || null,
          customer_phone: updatedTicket.customer_phone || ticket.customer_phone || null,
          // Contact bilgileri
          contact_name: updatedTicket.contact_name || ticket.contact_name || null,
          contact_first_name: updatedTicket.contact_first_name || ticket.contact_first_name || null,
          contact_last_name: updatedTicket.contact_last_name || ticket.contact_last_name || null,
          contact_email: updatedTicket.contact_email || ticket.contact_email || null,
          contact_phone: updatedTicket.contact_phone || ticket.contact_phone || null,
          contact_position: updatedTicket.contact_position || ticket.contact_position || null,
          // Diğer alanlar
          assigned_to: updatedTicket.assigned_to || ticket.assigned_to || null,
          assignedTo: updatedTicket.assignedTo || ticket.assignedTo || null,
          assigned_user_name: updatedTicket.assigned_user_name || ticket.assigned_user_name || null,
          created_by: updatedTicket.created_by || ticket.created_by || null,
          created_at: updatedTicket.created_at || ticket.created_at || new Date().toISOString(),
          updated_at: updatedTicket.updated_at || new Date().toISOString(),
          due_date: updatedTicket.due_date || ticket.due_date || null,
          comments: updatedTicket.comments || ticket.comments || [],
          attachments: updatedTicket.attachments || ticket.attachments || [],
          // Ek alanlar
          ...updatedTicket
        };
      } else {
        throw new Error(response.data.message || "Bilet güncellenemedi");
      }
    } catch (error: any) {
      console.error("Bilet güncellenirken hata oluştu:", error);
      throw error;
    }
  },
  
  // Bileti çözümle
  resolveTicket: async (ticket: { id: string, resolution_notes: string, tags?: string[] }): Promise<Ticket> => {
    try {
      // Kullanıcı ID'sini al
      const userId = getUserId();
      
      const ticketToResolve = {
        ...ticket,
        resolved_by: userId
      };
      
      const response = await axios.post('/api/main/tickets/resolveTicket', ticketToResolve);
      
      if (response.data.success) {
        // API'den dönen veriyi güvenli bir şekilde işle
        const resolvedTicket = response.data.data || {};
        
        return {
          ...resolvedTicket,
          status: 'resolved',
          updated_at: resolvedTicket.updated_at || new Date().toISOString(),
          resolution_time: resolvedTicket.resolution_time || new Date().toISOString(),
        };
      } else {
        throw new Error(response.data.message || "Bilet çözümlenemedi");
      }
    } catch (error: any) {
      console.error("Bilet çözümlenirken hata oluştu:", error);
      throw error;
    }
  },

  // Yorum ekle
  addComment: async (comment: any): Promise<any> => {
    try {
      // Yorum eklemeden önce kullanıcı ID'sini ekle
      const userId = getUserId();
      const commentWithUserId = {
        ...comment,
        user_id: userId
      };
      
      const response = await axios.post('/api/main/tickets/addComment', commentWithUserId);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Yorum eklenemedi");
      }
    } catch (error: any) {
      console.error("Yorum eklenirken hata oluştu:", error);
      throw error;
    }
  },

  // Bilet etiketlerini getir
  getTicketTags: async (ticketId: string): Promise<Tag[]> => {
    try {
      const response = await axios.get(`/api/main/tickets/getTicketTags?ticketId=${ticketId}`);
      
      if (response.data.success) {
        return response.data.tags || [];
      } else {
        throw new Error(response.data.message || "Etiketler alınamadı");
      }
    } catch (error: any) {
      console.error("Etiketler alınırken hata oluştu:", error);
      throw error;
    }
  }
};

// Not: CompanyService artık kullanılmıyor, bunun yerine CompaniesProvider kullanılıyor
export const CompanyService = {
  // Tüm firmaları getir
  getCompanies: async (): Promise<Company[]> => {
    try {
      const response = await axios.post('/api/main/companies/companiesList');
      return response.data || [];
    } catch (error: any) {
      console.error("Firmalar alınırken hata oluştu:", error);
      throw error;
    }
  },
  
  // Firma detaylarını getir
  getCompanyById: async (companyId: string): Promise<Company> => {
    try {
      const response = await axios.get(`/api/main/companies/getCompanyById?companyId=${companyId}`);
      return response.data || {};
    } catch (error: any) {
      console.error("Firma detayı alınırken hata oluştu:", error);
      throw error;
    }
  }
};
