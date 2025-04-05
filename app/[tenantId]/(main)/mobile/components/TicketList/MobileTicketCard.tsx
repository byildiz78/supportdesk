"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Ticket } from "@/types/tickets";
import { 
  FaBuilding,
  FaUser,
  FaTag,
  FaCalendarAlt,
  FaClock
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// Bilet durumlarına göre renk ve etiket tanımları
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  pending: "bg-yellow-500",
  waiting: "bg-yellow-500",
  in_progress: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
  cancelled: "bg-red-500",
  reopened: "bg-orange-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  pending: "Beklemede",
  waiting: "Beklemede",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
  cancelled: "İptal",
  reopened: "Tekrar Açıldı",
};

// Öncelik seviyelerine göre renk ve etiket tanımları
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-500",
  normal: "bg-blue-500",
  high: "bg-red-500",
  urgent: "bg-red-700",
  critical: "bg-purple-700",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil",
  critical: "Kritik",
};

interface MobileTicketCardProps {
  ticket: Ticket;
  onClick: (ticketId: string) => void;
}

export function MobileTicketCard({ ticket, onClick }: MobileTicketCardProps) {
  // Bilet durumu ve önceliği için renk ve etiket belirle
  const status = ticket.status?.toLowerCase() || "new";
  const priority = ticket.priority?.toLowerCase() || "normal";
  
  const statusColor = STATUS_COLORS[status] || "bg-gray-500";
  const statusLabel = STATUS_LABELS[status] || "Bilinmiyor";
  
  const priorityColor = PRIORITY_COLORS[priority] || "bg-blue-500";
  const priorityLabel = PRIORITY_LABELS[priority] || "Normal";
  
  // Tarih bilgileri
  const createdAt = ticket.created_at || ticket.createdAt;
  const updatedAt = ticket.updated_at || ticket.updatedAt;
  
  // Firma ve kişi bilgileri
  const companyName = ticket.company_name || ticket.companyName || "Belirtilmemiş";
  const customerName = ticket.customer_name || ticket.customerName || "Belirtilmemiş";
  const assignedToName = ticket.assigned_to_name || ticket.assignedUserName || "Atanmamış";
  
  // Tarih formatını düzenle
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Tarih yok";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (e) {
      return "Geçersiz tarih";
    }
  };
  
  return (
    <Card 
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors border border-gray-200 dark:border-gray-800"
      onClick={() => onClick(ticket.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <span className="font-medium text-sm">#{ticket.ticketno || ticket.id}</span>
          {ticket.sla_breach && (
            <Badge variant="destructive" className="ml-2">SLA İhlali</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${statusColor} text-white`}>
            {statusLabel}
          </Badge>
          <Badge className={`${priorityColor} text-white`}>
            {priorityLabel}
          </Badge>
        </div>
      </div>
      
      <h3 className="font-semibold text-base mb-2 line-clamp-2">{ticket.title}</h3>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <FaBuilding className="mr-1.5 h-3 w-3 flex-shrink-0" />
          <span className="truncate">{companyName}</span>
        </div>
        <div className="flex items-center">
          <FaUser className="mr-1.5 h-3 w-3 flex-shrink-0" />
          <span className="truncate">{customerName}</span>
        </div>
        <div className="flex items-center">
          <FaTag className="mr-1.5 h-3 w-3 flex-shrink-0" />
          <span className="truncate">{ticket.category_name || "Kategori yok"}</span>
        </div>
        <div className="flex items-center">
          <FaUser className="mr-1.5 h-3 w-3 flex-shrink-0 text-blue-500" />
          <span className="truncate">{assignedToName}</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <div className="flex items-center">
          <FaCalendarAlt className="mr-1.5 h-3 w-3" />
          <span>Oluşturulma: {formatDate(createdAt)}</span>
        </div>
        <div className="flex items-center">
          <FaClock className="mr-1.5 h-3 w-3" />
          <span>Güncelleme: {formatDate(updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}
