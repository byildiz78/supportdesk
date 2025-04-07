"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusHistoryService } from "@/app/[tenantId]/(main)/services/status-history-service";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { processHtmlContent } from "@/utils/text-utils";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  XCircle, 
  User, 
  ArrowRightCircle, 
  PlusCircle,
  X
} from "lucide-react";
import { getStatusChange } from "@/lib/utils";

interface TicketStatusHistoryProps {
  ticketId: string;
}

// Status colors and icons configuration
interface StatusConfig {
  color: string;
  bgColor: string;
  lightBgColor: string;
  darkBgColor: string;
  icon: React.ReactNode;
}

const statusConfigs: Record<string, StatusConfig> = {
  new: {
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500",
    lightBgColor: "bg-blue-50",
    darkBgColor: "dark:bg-blue-950/30",
    icon: <PlusCircle className="h-3.5 w-3.5" />
  },
  open: {
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500",
    lightBgColor: "bg-green-50",
    darkBgColor: "dark:bg-green-950/30",
    icon: <AlertCircle className="h-3.5 w-3.5" />
  },
  in_progress: {
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-500",
    lightBgColor: "bg-indigo-50",
    darkBgColor: "dark:bg-indigo-950/30",
    icon: <Clock className="h-3.5 w-3.5" />
  },
  waiting: {
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-500",
    lightBgColor: "bg-amber-50",
    darkBgColor: "dark:bg-amber-950/30",
    icon: <HelpCircle className="h-3.5 w-3.5" />
  },
  resolved: {
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-500",
    lightBgColor: "bg-purple-50",
    darkBgColor: "dark:bg-purple-950/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />
  },
  closed: {
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-500",
    lightBgColor: "bg-gray-50",
    darkBgColor: "dark:bg-gray-800/30",
    icon: <XCircle className="h-3.5 w-3.5" />
  },
  reopened: {
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500",
    lightBgColor: "bg-red-50",
    darkBgColor: "dark:bg-red-950/30",
    icon: <ArrowRightCircle className="h-3.5 w-3.5" />
  },
  assignment: {
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-500",
    lightBgColor: "bg-sky-50",
    darkBgColor: "dark:bg-sky-950/30",
    icon: <User className="h-3.5 w-3.5" />
  },
  category: {
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-500",
    lightBgColor: "bg-emerald-50",
    darkBgColor: "dark:bg-emerald-950/30",
    icon: <ArrowRightCircle className="h-3.5 w-3.5" />
  },
  deleted: {
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500",
    lightBgColor: "bg-red-50",
    darkBgColor: "dark:bg-red-950/30",
    icon: <X className="h-3.5 w-3.5" />
  }
};

const getStatusConfig = (status: string, isAssignment: boolean = false, isCategory: boolean = false, isDeleted: boolean = false): StatusConfig => {
  if (isCategory) {
    return statusConfigs.category;
  }
  if (isAssignment) {
    return statusConfigs.assignment;
  }
  if (isDeleted) {
    return statusConfigs.deleted;
  }
  return statusConfigs[status.toLowerCase()] || {
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-400",
    lightBgColor: "bg-gray-50",
    darkBgColor: "dark:bg-gray-800/30",
    icon: <HelpCircle className="h-3.5 w-3.5" />
  };
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Bilinmiyor";
  
  // Adjust for timezone difference (3 hours = 10800 seconds)
  if (seconds <= 10800) {
    if (seconds < 60) {
      return "1 dakikadan az";
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} dakika`;
  }
  
  // Normal duration calculation (for more than 3 hours)
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0) parts.push(`${hours} saat`);
  if (minutes > 0) parts.push(`${minutes} dakika`);
  
  return parts.length > 0 ? parts.join(' ') : '1 dakikadan az';
};

export function TicketStatusHistory({ ticketId }: TicketStatusHistoryProps) {
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      if (!ticketId) return;
      
      try {
        setLoading(true);
        const history = await StatusHistoryService.getTicketStatusHistory(ticketId);
        setStatusHistory(history);
      } catch (error) {
        console.error("Durum geçmişi alınırken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusHistory();
  }, [ticketId]);

  return (
    <Card className="h-full border border-gray-100 dark:border-gray-800 shadow-sm">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-base font-medium text-gray-800 dark:text-gray-200">Durum Geçmişi</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <ScrollArea className="h-auto max-h-[600px] pr-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : statusHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6">
              <div className="flex justify-center mb-1.5">
                <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs">Durum geçmişi bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusHistory.map((item, index) => {
                const isAssignment = item.is_assignment_change;
                const isCategory = item.is_category_change;
                const isDeleted = item.new_status === 'deleted';
                const statusConfig = getStatusConfig(item.new_status, isAssignment, isCategory, isDeleted);
                
                return (
                <div key={item.id} className="relative pl-6 pb-4">
                  {/* Timeline line */}
                  {index < statusHistory.length - 1 && (
                    <div className="absolute left-3 top-5 bottom-0 w-px bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-600 dark:to-gray-800/10" />
                  )}
                  
                  {/* Status icon */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${statusConfig.lightBgColor} ${statusConfig.darkBgColor} border border-gray-100 dark:border-gray-700 shadow-sm`}>
                    <span className={statusConfig.color}>
                      {statusConfig.icon}
                    </span>
                  </div>
                  
                  <div className="flex flex-col bg-white dark:bg-gray-800/40 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className={`px-1.5 py-0.5 text-xs ${statusConfig.color} ${statusConfig.lightBgColor} ${statusConfig.darkBgColor} border-none`}>
                        <span className="flex items-center gap-1">
                          {statusConfig.icon}
                          <span>{isCategory ? "Kategori Değişikliği" : isAssignment ? "Atama Değişikliği" : getStatusChange(item.new_status)}</span>
                        </span>
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {format(new Date(item.changed_at || item.changed_at_local), 'd MMMM yyyy HH:mm', { locale: tr })}
                      </span>
                    </div>
                    
                    <div className="mt-0.5 text-xs">
                      <span className="font-medium">{item.changed_by_name || 'Sistem'}</span> tarafından 
                      
                      {isCategory ? (
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          {item.previous_category_id !== item.new_category_id && (
                            <>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Kategori: </span>
                              <span className="font-medium">{item.previous_category_name || 'Yok'} → {item.new_category_name || 'Yok'}</span>
                              <br />
                            </>
                          )}
                          
                          {item.previous_subcategory_id !== item.new_subcategory_id && (
                            <>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Alt Kategori: </span>
                              <span className="font-medium">{item.previous_subcategory_name || 'Yok'} → {item.new_subcategory_name || 'Yok'}</span>
                              <br />
                            </>
                          )}
                          
                          {item.previous_group_id !== item.new_group_id && (
                            <>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Grup: </span>
                              <span className="font-medium">{item.previous_group_name || 'Yok'} → {item.new_group_name || 'Yok'}</span>
                            </>
                          )}
                        </span>
                      ) : isAssignment ? (
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-sky-700 dark:text-sky-400">{processHtmlContent(item.previous_status || 'Atanmamış')}</span> kullanıcısından 
                          <span className="font-medium text-sky-700 dark:text-sky-400 ml-1">{processHtmlContent(item.new_status || '')}</span> kullanıcısına atandı.
                        </span>
                      ) : item.previous_status ? (
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          <Badge variant="outline" className={`px-1 py-0.5 text-xs ${getStatusConfig(item.previous_status).color} ${getStatusConfig(item.previous_status).lightBgColor} ${getStatusConfig(item.previous_status).darkBgColor} border-none ml-0.5 mr-0.5`}>
                            <span className="flex items-center gap-0.5">
                              {getStatusConfig(item.previous_status).icon}
                              <span>{getStatusChange(item.previous_status)}</span>
                            </span>
                          </Badge> 
                          durumundan 
                          <Badge variant="outline" className={`px-1 py-0.5 text-xs ${statusConfig.color} ${statusConfig.lightBgColor} ${statusConfig.darkBgColor} border-none ml-0.5 mr-0.5`}>
                            <span className="flex items-center gap-0.5">
                              {statusConfig.icon}
                              <span>{getStatusChange(item.new_status)}</span>
                            </span>
                          </Badge> 
                          durumuna değiştirildi.
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          <Badge variant="outline" className={`px-1 py-0.5 text-xs ${statusConfig.color} ${statusConfig.lightBgColor} ${statusConfig.darkBgColor} border-none ml-0.5 mr-0.5`}>
                            <span className="flex items-center gap-0.5">
                              {statusConfig.icon}
                              <span>{getStatusChange(item.new_status)}</span>
                            </span>
                          </Badge> 
                          olarak oluşturuldu.
                        </span>
                      )}
                    </div>
                    
                    {item.time_in_status && !isAssignment && !isCategory && (
                      <div className="mt-1.5 text-xs flex items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-1.5 rounded">
                        <Clock className="h-2.5 w-2.5 mr-1 text-gray-400" />
                        Önceki durumda geçirilen süre: 
                        <span className="font-medium ml-1">
                          {Math.abs(item.time_in_status - 10800) < 300 
                            ? "1 dakikadan az" 
                            : formatDuration(item.time_in_status)
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default TicketStatusHistory;