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
  PlusCircle
} from "lucide-react";

interface TicketStatusHistoryProps {
  ticketId: string;
}

// Durum renkleri ve ikonları için yapılandırma
interface StatusConfig {
  color: string;
  bgColor: string;
  lightBgColor: string;
  icon: React.ReactNode;
}

const statusConfigs: Record<string, StatusConfig> = {
  new: {
    color: "text-blue-700",
    bgColor: "bg-blue-500",
    lightBgColor: "bg-blue-100",
    icon: <PlusCircle className="h-4 w-4" />
  },
  open: {
    color: "text-green-700",
    bgColor: "bg-green-500",
    lightBgColor: "bg-green-100",
    icon: <AlertCircle className="h-4 w-4" />
  },
  in_progress: {
    color: "text-indigo-700",
    bgColor: "bg-indigo-500",
    lightBgColor: "bg-indigo-100",
    icon: <Clock className="h-4 w-4" />
  },
  waiting: {
    color: "text-amber-700",
    bgColor: "bg-amber-500",
    lightBgColor: "bg-amber-100",
    icon: <HelpCircle className="h-4 w-4" />
  },
  resolved: {
    color: "text-purple-700",
    bgColor: "bg-purple-500",
    lightBgColor: "bg-purple-100",
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  closed: {
    color: "text-gray-700",
    bgColor: "bg-gray-500",
    lightBgColor: "bg-gray-100",
    icon: <XCircle className="h-4 w-4" />
  },
  reopened: {
    color: "text-red-700",
    bgColor: "bg-red-500",
    lightBgColor: "bg-red-100",
    icon: <ArrowRightCircle className="h-4 w-4" />
  },
  assignment: {
    color: "text-sky-700",
    bgColor: "bg-sky-500",
    lightBgColor: "bg-sky-100",
    icon: <User className="h-4 w-4" />
  }
};

const getStatusConfig = (status: string, isAssignment: boolean = false): StatusConfig => {
  if (isAssignment) {
    return statusConfigs.assignment;
  }
  return statusConfigs[status.toLowerCase()] || {
    color: "text-gray-700",
    bgColor: "bg-gray-400",
    lightBgColor: "bg-gray-100",
    icon: <HelpCircle className="h-4 w-4" />
  };
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Bilinmiyor";
  
  // Zaman dilimi farkını düzelt (3 saat = 10800 saniye)
  // Eğer süre 3 saatten az ise, zaman dilimi farkı olabilir
  if (seconds <= 10800) {
    // Çok kısa süreler için
    if (seconds < 60) {
      return "1 dakikadan az";
    }
    // Dakika cinsinden göster
    const minutes = Math.floor(seconds / 60);
    return `${minutes} dakika`;
  }
  
  // Normal süre hesaplaması (3 saatten fazla ise)
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Durum Geçmişi</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-auto max-h-[800px]">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : statusHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="flex justify-center mb-2">
                <Clock className="h-12 w-12 text-gray-300" />
              </div>
              <p className="text-sm">Durum geçmişi bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((item, index) => {
                const isAssignment = item.is_assignment_change;
                const statusConfig = getStatusConfig(item.new_status, isAssignment);
                
                return (
                <div key={item.id} className="relative pl-8 pb-6">
                  {/* Zaman çizgisi çizgisi */}
                  {index < statusHistory.length - 1 && (
                    <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-100" />
                  )}
                  
                  {/* Durum ikonu */}
                  <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${statusConfig.lightBgColor} border-2 border-white shadow-sm`}>
                    <span className={statusConfig.color}>
                      {statusConfig.icon}
                    </span>
                  </div>
                  
                  <div className="flex flex-col bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.lightBgColor} border-none`}>
                        <span className="flex items-center gap-1">
                          {statusConfig.icon}
                          <span>{isAssignment ? "Atama Değişikliği" : item.new_status}</span>
                        </span>
                      </Badge>
                      <span className="text-sm text-gray-500 font-medium">
                        {format(new Date(item.changed_at_local || item.changed_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm">
                      <span className="font-medium">{item.changed_by_name || 'Sistem'}</span> tarafından 
                      {isAssignment ? (
                        <span className="ml-1 text-gray-700">
                          <span className="font-medium text-sky-700">{processHtmlContent(item.previous_status || 'Atanmamış')}</span> kullanıcısından 
                          <span className="font-medium text-sky-700 ml-1">{processHtmlContent(item.new_status || '')}</span> kullanıcısına atandı.
                        </span>
                      ) : item.previous_status ? (
                        <span className="ml-1 text-gray-700">
                          <Badge variant="outline" className={`${getStatusConfig(item.previous_status).color} ${getStatusConfig(item.previous_status).lightBgColor} border-none ml-1 mr-1`}>
                            <span className="flex items-center gap-1">
                              {getStatusConfig(item.previous_status).icon}
                              <span>{item.previous_status}</span>
                            </span>
                          </Badge> 
                          durumundan 
                          <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.lightBgColor} border-none ml-1 mr-1`}>
                            <span className="flex items-center gap-1">
                              {statusConfig.icon}
                              <span>{item.new_status}</span>
                            </span>
                          </Badge> 
                          durumuna değiştirildi.
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-700">
                          <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.lightBgColor} border-none ml-1 mr-1`}>
                            <span className="flex items-center gap-1">
                              {statusConfig.icon}
                              <span>{item.new_status}</span>
                            </span>
                          </Badge> 
                          olarak oluşturuldu.
                        </span>
                      )}
                    </div>
                    
                    {item.time_in_status && !isAssignment && (
                      <div className="mt-2 text-xs flex items-center text-gray-500 bg-gray-50 p-2 rounded">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
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
