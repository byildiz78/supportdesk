import axios from "@/lib/axios";
import { getUserId } from '@/utils/user-utils';

export const StatusHistoryService = {
  /**
   * Bilet durum değişikliği kaydı oluşturur
   * @param ticketId Bilet ID'si
   * @param previousStatus Önceki durum
   * @param newStatus Yeni durum
   * @returns Oluşturulan kayıt
   */
  createStatusHistoryEntry: async (
    ticketId: string,
    previousStatus: string | null,
    newStatus: string
  ): Promise<any> => {
    try {
      // Kullanıcı ID'sini localStorage'dan al
      const userId = getUserId();

      // Durum değişikliği kaydı için gerekli bilgileri topla
      const statusHistoryData = {
        ticket_id: ticketId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: userId
      };

      // API endpoint'ine istek gönder
      const response = await axios.post('/api/main/tickets/createStatusHistory', statusHistoryData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Durum değişikliği kaydı oluşturulamadı");
      }
    } catch (error: any) {
      console.error("Durum değişikliği kaydı oluşturulurken hata:", error);
      throw error;
    }
  },

  /**
   * Bir biletin durum geçmişini getirir
   * @param ticketId Bilet ID'si
   * @returns Durum geçmişi kayıtları
   */
  getTicketStatusHistory: async (ticketId: string): Promise<any[]> => {
    try {
      const response = await axios.get(`/api/main/tickets/getStatusHistory?ticketId=${ticketId}`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Durum geçmişi alınamadı");
      }
    } catch (error: any) {
      console.error("Durum geçmişi alınırken hata:", error);
      return [];
    }
  },

  /**
   * Bilet atanan kişi değişikliği kaydı oluşturur
   * @param ticketId Bilet ID'si
   * @param previousAssignee Önceki atanan kişi
   * @param newAssignee Yeni atanan kişi
   * @param previousAssigneeName Önceki atanan kişi adı
   * @param newAssigneeName Yeni atanan kişi adı
   * @returns Oluşturulan kayıt
   */
  createAssignmentHistoryEntry: async (
    ticketId: string,
    previousAssignee: string | null,
    newAssignee: string,
    previousAssigneeName: string | null,
    newAssigneeName: string
  ): Promise<any> => {
    try {
      // Kullanıcı ID'sini localStorage'dan al
      const userId = getUserId();

      // Atanan kişi değişikliği kaydı için gerekli bilgileri topla
      const assignmentHistoryData = {
        ticket_id: ticketId,
        previous_status: `Atanan: ${previousAssigneeName || 'Atanmamış'}`,
        new_status: `Atanan: ${newAssigneeName}`,
        changed_by: userId,
        is_assignment_change: true
      };

      // API endpoint'ine istek gönder
      const response = await axios.post('/api/main/tickets/createStatusHistory', assignmentHistoryData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Atanan kişi değişikliği kaydı oluşturulamadı");
      }
    } catch (error: any) {
      console.error("Atanan kişi değişikliği kaydı oluşturulurken hata:", error);
      throw error;
    }
  }
};

export default StatusHistoryService;
