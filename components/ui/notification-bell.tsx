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
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { useNotificationStore, Notification as NotificationItem } from '@/stores/notification-store';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, ru } from 'date-fns/locale';
import { useLanguage } from '@/providers/language-provider';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { useTab } from '@/hooks/use-tab';
import { getPriorityChange, getStatusChange } from '@/lib/utils';
import { Ticket } from '@/types/tickets';
import { useTabStore } from '@/stores/tab-store';
import { clearTicketCache } from '@/app/[tenantId]/(main)/tickets/detail/page';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineUsersStore } from '@/stores/online-users-store';
import { getUserId } from '@/utils/user-utils';
import axios from '@/lib/axios';

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
  UNREAD: 'unread',
  HIGH_PRIORITY: 'high_priority',
  ONLINE_USERS: 'online_users'
} as const;

type NotificationFilter = (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

const NOTIFICATION_LABELS: Record<NotificationFilter, string> = {
  all: 'Tümü',
  unread: 'Okunmamış',
  high_priority: 'Yüksek Öncelik',
  online_users: 'Online Kullanıcılar'
};

export function NotificationBell() {
  const notificationStore = useNotificationStore();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    isLoading
  } = notificationStore;
  const { users: onlineUsers, fetchOnlineUsers, isLoading: isLoadingOnlineUsers } = useOnlineUsersStore();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { addTab, setActiveTab } = useTabStore();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>(NOTIFICATION_FILTERS.ALL);
  const [lastFetched, setLastFetched] = useState(new Date());

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
    if (activeFilter === NOTIFICATION_FILTERS.UNREAD) {
      return notification.isseen === false;
    } else if (activeFilter === NOTIFICATION_FILTERS.HIGH_PRIORITY) {
      return notification.priority?.toLowerCase() === 'high' || 
             notification.priority?.toLowerCase() === 'yüksek';
    }
    return true;
  });

  const handleRefresh = async () => {
    await fetchNotifications();
    setLastFetched(new Date());
  };

  // Tüm biletleri görüldü olarak işaretleyen fonksiyon
  const markAllTicketsAsSeen = async () => {
    try {
      const userId = getUserId();
      // Tüm okunmamış bildirimlerin bilet ID'lerini al
      const unreadTicketIds = notifications
        .filter(notification => notification.isseen === false)
        .map(notification => notification.id);
      
      if (unreadTicketIds.length === 0) return;
      
      // API'ye istek at ve tüm biletleri görüldü olarak işaretle
      const response = await axios.post('/api/main/tickets/is-seenTickets', {
        id: unreadTicketIds,
        userId: userId
      });
      
      // Tüm bildirimleri okundu olarak işaretle
      markAllAsRead();
    } catch (error) {
      console.error('Error marking all tickets as seen:', error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      // Bildirimi okundu olarak işaretle
      markAsRead(notification.id);
      const userId = getUserId();
      
      // Bileti görüldü olarak işaretle
      const response = await axios.post('/api/main/tickets/is-seenTickets', {
        id: notification.id,
        userId: userId
      });
      
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
            default: (props) => <module.default {...props} ticketId={notification.id} />
          }))
        });
        setActiveTab(tabId);
      }
      
      // Dropdown'ı kapat
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking ticket as seen:', error);
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
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-accent/50 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-200"
                aria-label="Bildirimler"
              >
                <motion.div 
                  animate={unreadCount > 0 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.4, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 5 }}
                >
                  <Bell className="h-5 w-5 text-foreground" />
                </motion.div>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Badge 
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center"
                        variant="destructive"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            <p>Bildirimler</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent
          align="end"
          className="w-[640px] max-w-[95vw] p-0 rounded-lg shadow-lg border border-border/40 bg-background/95 backdrop-blur-md"
          sideOffset={8}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="border-b px-4 py-3 space-y-0 flex flex-row items-center justify-between sticky top-0 bg-background/98 backdrop-blur-lg z-10">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">Bildirimler</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeFilter === NOTIFICATION_FILTERS.ONLINE_USERS ? 
                      `${onlineUsers.length} aktif kullanıcı` : 
                      `${filteredNotifications.length} bildirim`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isLoading || isLoadingOnlineUsers}
                  title="Yenile"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading || isLoadingOnlineUsers ? 'animate-spin' : ''}`} />
                </Button>
                
                {filteredNotifications.length > 0 && activeFilter !== NOTIFICATION_FILTERS.ONLINE_USERS && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-medium"
                    onClick={markAllTicketsAsSeen}
                    title="Tümünü Okundu İşaretle"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Tümünü Okundu İşaretle
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <div className="border-b bg-muted/30 px-3 py-2 sticky top-[57px] z-10">
              <div className="flex items-center justify-between gap-1 w-full">
                {Object.entries(NOTIFICATION_FILTERS).map(([key, value]) => (
                  <Button
                    key={value}
                    variant={activeFilter === value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter(value)}
                    className="h-7 text-xs font-medium flex-1 px-2"
                  >
                    {NOTIFICATION_LABELS[value]}
                    {value === NOTIFICATION_FILTERS.ALL && filteredNotifications.length > 0 && (
                      <Badge className="ml-1.5 bg-primary text-primary-foreground border-white dark:border-black text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center">
                        {filteredNotifications.length}
                      </Badge>
                    )}
                    {value === NOTIFICATION_FILTERS.UNREAD && unreadCount > 0 && (
                      <Badge className="ml-1.5 bg-red-500 text-white border-white dark:border-black text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground px-4 py-2 border-b flex items-center justify-between bg-muted/10">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Son güncelleme: {lastFetchedTime} önce</span>
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                {filteredNotifications.length} bildirim
              </span>
            </div>
            
            <div className="max-h-[500px] p-4 overflow-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
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
                filteredNotifications.length === 0 ? (
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
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-0 cursor-pointer block transition-colors duration-150 hover:bg-accent/30 ${
                          notification.isseen === false ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="p-4 relative group">
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-2 h-16 rounded-sm ${getPriorityDot(notification.priority)}`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-2">
                                  <Badge className="font-semibold text-sm bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-md">
                                    #{notification.ticketno}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                      notification.isseen 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                                    }`}
                                  >
                                    {notification.isseen 
                                      ? <Eye className="h-3 w-3 mr-1" /> 
                                      : <EyeOff className="h-3 w-3 mr-1" />
                                    }
                                    {notification.isseen ? 'Okundu' : 'Okunmadı'}
                                  </Badge>
                                </div>
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
                      </DropdownMenuItem>
                    ))}
                  </div>
                )
              )}
            </div>
            
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t bg-muted/30 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors duration-150 px-4"
                  onClick={() => setIsOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            )}
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}