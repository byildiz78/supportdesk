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
  isseen: boolean;
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
      
      const response = await axios.get(apiUrl);
      
      if (response.data) {
        // API'den gelen bildirimleri işle
        const newNotifications = response.data;
        
        // Okunmamış bildirimleri say (isseen=false olanlar)
        const unreadCount = newNotifications.filter((n: Notification) => n.isseen === false).length;
        
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
        notification.id === id ? { ...notification, isseen: true } : notification
      );
      
      const unreadCount = updatedNotifications.filter(n => n.isseen === false).length;
      
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
        isseen: true
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
