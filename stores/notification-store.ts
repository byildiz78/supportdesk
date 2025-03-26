import { create } from 'zustand';
import axios from '@/lib/axios';
import { useUserStore } from './user-store';
import { getUserId } from '@/utils/user-utils';

export interface Notification {
  id: string;
  ticketno: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string;
  created_at: string;
  customer_name: string;
  company_name: string;
  category_name: string;
  subcategory_name: string;
  assigned_user_name: string;
  assigned_user_surname: string;
  isRead: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastChecked: Date | null;
  
  // Actions
  fetchNotifications: (hours?: number) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  lastChecked: null,
  
  fetchNotifications: async (hours = 24) => {
    try {
      set({ isLoading: true });
      
      // Oturum açmış kullanıcının ID'sini almak için
      // Mevcut kullanıcı bilgisini localStorage'dan alalım
      const userId = getUserId();
      
      if (!userId) {
        console.error('Kullanıcı ID bulunamadı');
        set({ isLoading: false });
        return;
      }
      
      const apiUrl = `/api/main/tickets/assigned-tickets?userId=${userId}&hours=${hours}`;
      console.log('API isteği yapılıyor:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('API yanıtı:', response.data);
      
      if (response.data) {
        // Mevcut bildirimleri al
        const currentNotifications = get().notifications;
        const currentIds = new Set(currentNotifications.map(n => n.id));
        
        // Yeni bildirimleri işle
        const newNotifications = response.data.map((notification: any) => ({
          ...notification,
          isRead: currentIds.has(notification.id) 
            ? currentNotifications.find(n => n.id === notification.id)?.isRead 
            : false
        }));
        
        // Okunmamış bildirimleri say
        const unreadCount = newNotifications.filter((n: Notification) => !n.isRead).length;
        
        set({ 
          notifications: newNotifications,
          unreadCount,
          isLoading: false,
          lastChecked: new Date()
        });
      }
    } catch (error) {
      console.error('Bildirimler alınırken hata oluştu:', error);
      set({ isLoading: false });
    }
  },
  
  markAsRead: (id: string) => {
    set(state => {
      const updatedNotifications = state.notifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      );
      
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      
      return { 
        notifications: updatedNotifications,
        unreadCount
      };
    });
  },
  
  markAllAsRead: () => {
    set(state => {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true
      }));
      
      return { 
        notifications: updatedNotifications,
        unreadCount: 0
      };
    });
  },
  
  clearNotifications: () => {
    set({ 
      notifications: [],
      unreadCount: 0
    });
  }
}));
