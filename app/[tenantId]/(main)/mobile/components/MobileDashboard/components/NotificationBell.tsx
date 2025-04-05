import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  RefreshCw, 
  Clock, 
  User,
  Briefcase, 
  Tag, 
  CheckCircle,
  ArrowRight,
  Filter,
  Check,
  ChevronDown,
  Info,
  Circle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotificationStore } from '@/stores/notification-store';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPriorityChange, getStatusChange } from '@/lib/utils';
import { useTabStore } from '@/stores/tab-store';
import { clearTicketCache } from '@/app/[tenantId]/(main)/tickets/detail/page';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineUsersStore } from '@/stores/online-users-store';

// Locale tipi tanımı
type DateLocale = typeof tr | typeof enUS | typeof ru;

const locales: Record<string, DateLocale> = {
  tr,
  en: enUS,
  ru,
  az: ru, // Azerbaycan için şimdilik Rusça kullanıyoruz
};

const NOTIFICATION_FILTERS = {
  ALL: 'all',
  HIGH_PRIORITY: 'high_priority',
  ONLINE_USERS: 'online_users'
} as const;

type NotificationFilter = (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

const NOTIFICATION_LABELS: Record<NotificationFilter, string> = {
  all: 'Tümü',
  high_priority: 'Yüksek Öncelik',
  online_users: 'Online Kullanıcılar'
};

interface NotificationBellProps {
  onClose?: () => void;
  hideHeader?: boolean;
}

export function NotificationBell({ onClose, hideHeader = false }: NotificationBellProps) {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    isLoading
  } = useNotificationStore();
  const { users: onlineUsers, fetchOnlineUsers, isLoading: isLoadingOnlineUsers } = useOnlineUsersStore();
  const [isOpen, setIsOpen] = useState(false);
  const { addTab, setActiveTab } = useTabStore();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>(NOTIFICATION_FILTERS.ALL);
  const [lastFetched, setLastFetched] = useState(new Date());
  const language = 'tr'; // Varsayılan dil

  // İlk yükleme ve düzenli kontrol
  useEffect(() => {
    // İlk yükleme
    fetchNotifications().then(() => {
      setLastFetched(new Date());
    });
    fetchOnlineUsers();
    
    // Her 1 dakikada bir yeni bildirimleri ve online kullanıcıları kontrol et
    const interval = setInterval(() => {
      fetchNotifications().then(() => {
        setLastFetched(new Date());
      });
      fetchOnlineUsers();
    }, 1 * 60 * 1000); // 1 dakika
    
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchOnlineUsers]);

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === NOTIFICATION_FILTERS.HIGH_PRIORITY) {
      return notification.priority?.toLowerCase() === 'high' || 
             notification.priority?.toLowerCase() === 'yüksek';
    }
    return true;
  });

  const handleRefresh = async () => {
    await fetchNotifications();
    setLastFetched(new Date());
  };

  const handleNotificationClick = (notification: any) => {
    // Bildirimi okundu olarak işaretle
    markAsRead(notification.id);
    
    const tabId = `ticket-${notification.ticketno}`;
    
    // Önce bu ID'ye sahip bir tab var mı kontrol et
    const tabs = useTabStore.getState().tabs;
    const existingTab = tabs.find(tab => tab.id === tabId);
    
    // Her tıklamada önbelleği temizle, böylece her zaman API'den taze veri alınacak
    clearTicketCache(tabId);
    
    if (existingTab) {
      // Tab zaten açıksa, sadece o taba geçiş yap
      setActiveTab(tabId);
    } else {
      // Tab yoksa yeni tab oluştur
      addTab({
        id: tabId,
        title: `Talep #${notification.ticketno}`,
        lazyComponent: () => import('@/app/[tenantId]/(main)/tickets/detail/page').then(module => ({
          default: (props: any) => <module.default {...props} ticketId={notification.id} />
        }))
      });
      setActiveTab(tabId);
    }
    
    // Dropdown'ı kapat
    setIsOpen(false);
    
    // onClose prop'u varsa çağır
    if (onClose) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: locales[language] || locales.en
      });
    } catch (error) {
      return dateString;
    }
  };

  const getPriorityDot = (priority: string | undefined) => {
    const lowerPriority = priority?.toLowerCase();
    
    if (lowerPriority === 'high' || lowerPriority === 'yüksek') {
      return 'bg-red-500';
    } else if (lowerPriority === 'medium' || lowerPriority === 'orta') {
      return 'bg-amber-500';
    } else {
      return 'bg-emerald-500';
    }
  };

  const getStatusBadgeStyles = (status: string | undefined) => {
    switch(status) {
      case 'open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'waiting':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'closed':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    }
  };

  const getPriorityBadgeStyles = (priority: string | undefined) => {
    const lowerPriority = priority?.toLowerCase();
    
    if (lowerPriority === 'high' || lowerPriority === 'yüksek') {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    } else if (lowerPriority === 'medium' || lowerPriority === 'orta') {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    } else {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    }
  };

  const lastFetchedTime = formatDistanceToNow(lastFetched, { 
    addSuffix: false,
    locale: locales[language] || locales.en
  });

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div className="flex-none py-6 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bildirimler</h2>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleRefresh()}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin">
                      <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  ) : (
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Bildirimleri yenile</p>
              </TooltipContent>
            </Tooltip>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
            >
              <span className="sr-only">Kapat</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className={`border-b bg-muted/30 px-3 py-2 sticky ${hideHeader ? 'top-0' : 'top-[57px]'} z-10`}>
        <div className="flex items-center justify-between gap-1 w-full">
          {Object.entries(NOTIFICATION_FILTERS).map(([key, value]) => (
            <Button
              key={key}
              variant={activeFilter === value ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(value)}
              className={`h-7 text-xs font-medium flex-1 ${hideHeader ? 'px-1' : 'px-2'}`}
            >
              {NOTIFICATION_LABELS[value]}
              {value === NOTIFICATION_FILTERS.ALL && filteredNotifications.length > 0 && (
                <Badge className="ml-1.5 bg-primary text-primary-foreground border-white dark:border-black text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center">
                  {filteredNotifications.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
      
    

      <div className={`flex-1 overflow-y-auto ${hideHeader ? 'px-3' : 'px-6'} pb-6 
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-thumb]:bg-gray-300/50
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-transparent
          dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
          hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
          dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80`}
      >
        {activeFilter === NOTIFICATION_FILTERS.ONLINE_USERS ? (
          <div>
            {onlineUsers.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="bg-muted/40 h-20 w-20 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/60" />
                </div>
                <p className="font-medium text-foreground">Şu anda online kullanıcı yok</p>
                <p className="text-xs text-muted-foreground/70 mt-2 max-w-xs">
                  Son 2 dakika içinde aktif olan kullanıcılar burada görünecek
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="p-4 relative hover:bg-accent/30 transition-colors duration-150">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <User className="h-5 w-5 text-primary" />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {user.user_name}
                          </h4>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(user.last_heartbeat)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          >
                            <Circle className="h-2 w-2 fill-current" />
                            Online
                          </Badge>
                          {user.role && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                            >
                              {user.role}
                            </Badge>
                          )}
                          {user.department && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                            >
                              {user.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          isLoading ? (
            <div className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="animate-spin mb-4">
                <RefreshCw className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-foreground">Bildirimler yükleniyor...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="bg-muted/40 h-20 w-20 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-foreground">Yeni bildiriminiz yok</p>
              <p className="text-xs text-muted-foreground/70 mt-2 max-w-xs">
                Size atanan talepler ve güncellenen durumlar burada görünecek
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-0 cursor-pointer block transition-colors duration-150 hover:bg-accent/30 ${
                    !notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4 relative group">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-16 rounded-sm ${getPriorityDot(notification.priority)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <Badge className="font-semibold text-sm bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-md">
                            #{notification.ticketno}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-150">
                          {notification.title}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3 text-primary/70" />
                            <span className="truncate">{notification.customer_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3 text-primary/70" />
                            <span className="truncate">{notification.company_name}</span>
                          </div>
                          
                          {notification.assigned_user_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
                              <Tag className="h-3 w-3 text-primary/70" />
                              <span className="truncate">
                                Atayan: {notification.assigned_user_name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusBadgeStyles(notification.status)}`}
                          >
                            <Circle className="h-2 w-2 fill-current" />
                            {getStatusChange(notification.status)}
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getPriorityBadgeStyles(notification.priority)}`}
                          >
                            <Circle className="h-2 w-2 fill-current" />
                            {getPriorityChange(notification.priority)}
                          </Badge>
                          
                          <motion.div 
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
