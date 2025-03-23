import axios from "@/lib/axios";
import { getUserId } from '@/utils/user-utils';

export const AuditService = {
  /**
   * Audit log oluşturur
   * @param logEntry Log kaydı bilgileri
   * @returns Oluşturulan log kaydı
   */
  createAuditLog: async (logEntry: {
    entity_type: string;
    entity_id: string;
    action: string;
    previous_state?: any;
    new_state?: any;
  }): Promise<any> => {
    try {
      // Kullanıcı ID'sini localStorage'dan al
      const userId = getUserId();

      // Log kaydı için gerekli tüm bilgileri topla
      const auditLogData = {
        user_id: userId,
        entity_type: logEntry.entity_type,
        entity_id: logEntry.entity_id,
        action: logEntry.action,
        previous_state: logEntry.previous_state || null,
        new_state: logEntry.new_state || null
      };

      // API endpoint'ine istek gönder
      const response = await axios.post('/api/main/audit/createAuditLog', auditLogData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Audit log oluşturulamadı");
      }
    } catch (error: any) {
      console.error("Audit log oluşturulurken hata:", error);
      throw error;
    }
  },

  /**
   * Bilet durum değişikliklerini loglar
   * @param ticketId Bilet ID'si
   * @param previousStatus Önceki durum
   * @param newStatus Yeni durum
   * @param previousState Önceki bilet durumu (tüm alanlar)
   * @param newState Yeni bilet durumu (tüm alanlar)
   * @returns Oluşturulan log kaydı
   */
  logTicketStatusChange: async (
    ticketId: string,
    previousStatus: string,
    newStatus: string,
    previousState: any,
    newState: any
  ): Promise<any> => {
    return AuditService.createAuditLog({
      entity_type: 'ticket',
      entity_id: ticketId,
      action: `status_change`, 
      previous_state: {
        ...previousState,
        status_change: `${previousStatus}_to_${newStatus}` 
      },
      new_state: newState
    });
  },
  
  /**
   * Bilet görevlendirme değişikliklerini loglar
   * @param ticketId Bilet ID'si
   * @param previousAssignedTo Önceki atanan kişi ID'si
   * @param newAssignedTo Yeni atanan kişi ID'si
   * @param previousState Önceki bilet durumu (tüm alanlar)
   * @param newState Yeni bilet durumu (tüm alanlar)
   * @returns Oluşturulan log kaydı
   */
  logTicketAssignmentChange: async (
    ticketId: string,
    previousAssignedTo: string | null,
    newAssignedTo: string | null,
    previousState: any,
    newState: any
  ): Promise<any> => {
    return AuditService.createAuditLog({
      entity_type: 'ticket',
      entity_id: ticketId,
      action: `assignment_change`, 
      previous_state: {
        ...previousState,
        assignment_change: `${previousAssignedTo || 'none'}_to_${newAssignedTo || 'none'}` 
      },
      new_state: newState
    });
  }
};

export default AuditService;
