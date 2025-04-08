"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ticket } from "@/types/tickets";
import {
  FaSearch,
  FaFilter,
  FaSync,
  FaExclamationTriangle,
  FaCircle,
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaClock,
  FaTag,
  FaChevronRight,
  FaTimes,
  FaInbox,
  FaExclamationCircle,
  FaHouseUser,
  FaUserTie,
  FaTicketAlt,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaHourglassHalf
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSlaTime, sourceConfig } from "@/app/[tenantId]/(main)/tickets/components/config/ticket-config";
import TicketDetailModal from "../MobileDashboard/TicketDetailModal";

// Bilet durumlarına göre renk ve etiket tanımları
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  open: "bg-blue-500",
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
  open: "Açık",
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

interface MobileTicketListProps {
  tickets: Ticket[];
  title: string;
  description: string;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh: () => void;
  onFilterClick?: () => void;
  filters?: Record<string, any>;
}

export function MobileTicketList({
  tickets,
  title,
  description,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  onRefresh,
  onFilterClick,
  filters = {}
}: MobileTicketListProps) {
  const router = useRouter();
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Modal için state'ler
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketNo, setSelectedTicketNo] = useState<number | null>(null);


  // Arama terimini değiştirdiğimizde veya tickets değiştiğinde filtreleme yap
  useEffect(() => {
    // Önce tickets'in geçerli bir dizi olduğunu kontrol et
    if (!tickets || !Array.isArray(tickets)) {
      setFilteredTickets([]);
      return;
    }

    // Biletleri ticket numarasına göre azalan sırada sırala (en büyük numara en üstte)
    const sortedTickets = [...tickets].sort((a, b) => {
      const ticketNoA = a.ticketno || 0;
      const ticketNoB = b.ticketno || 0;
      return ticketNoB - ticketNoA; // Azalan sırada (desc)
    });

    if (!searchTerm.trim()) {
      setFilteredTickets(sortedTickets);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = sortedTickets.filter(ticket =>
      // Temel bilet bilgileri
      (ticket.title?.toLowerCase().includes(term) ?? false) ||
      (ticket.ticketno?.toString().toLowerCase().includes(term) ?? false) ||
      (ticket.description?.toLowerCase().includes(term) ?? false) ||

      // Firma ve müşteri bilgileri
      ((ticket.company_name || ticket.companyName)?.toLowerCase().includes(term) ?? false) ||

      // Müşteri bilgileri
      ((ticket.customer_name || ticket.customerName)?.toLowerCase().includes(term) ?? false) ||

      // Kategori bilgileri
      (ticket.category_name?.toLowerCase().includes(term) ?? false) ||
      (ticket.subcategory_name?.toLowerCase().includes(term) ?? false) ||

      // Atanan kişi bilgileri
      (ticket.assigned_to_name?.toLowerCase().includes(term) ?? false) ||
      (ticket.assignedUserName?.toLowerCase().includes(term) ?? false)
    );

    setFilteredTickets(filtered);
  }, [searchTerm, tickets]);


  const handleTicketClick = (ticketId: string, ticketNo: string) => {
    setSelectedTicketId(ticketId);
    setSelectedTicketNo(parseInt(ticketNo));
    setIsModalOpen(true);
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Tarih yok";

    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (e) {
      return "Geçersiz tarih";
    }
  };

  // Arama alanını temizle
  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Yenileme işlemi
  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Aktif filtre sayısını hesapla
  const getActiveFilterCount = () => {
    let count = 0;

    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.subcategory && filters.subcategory.length > 0) count++;
    if (filters.group && filters.group.length > 0) count++;
    if (filters.assigned_to && filters.assigned_to.length > 0) count++;
    if (filters.parent_company_id && filters.parent_company_id.length > 0) count++;
    if (filters.company_id && filters.company_id.length > 0) count++;
    if (filters.contact_id && filters.contact_id.length > 0) count++;
    if (filters.sla_breach !== undefined) count++;

    return count;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header Bölümü - Sadeleştirilmiş */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Başlık ve logo kısmı */}
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <FaTicketAlt className="h-3 w-3 text-blue-500" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {/* Arama kısmı */}
        <div className="px-4 pb-3">
          <div className="relative">
            <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`}>
              <FaSearch className="h-3.5 w-3.5" />
            </div>

            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Bilet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`pl-9 pr-16 py-2 h-9 text-sm w-full rounded-lg border-gray-200 dark:border-gray-700 
              ${isSearchFocused
                  ? 'ring-2 ring-blue-500 border-blue-500'
                  : 'focus:ring-blue-500 focus:border-blue-500'}`}
            />

            {/* Arama temizleme ve yenileme butonları */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                onClick={handleRefresh}
                className={`text-gray-500 p-1 rounded-full ${refreshing ? 'animate-spin text-blue-500' : ''}`}
              >
                <FaSync className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtre bilgisi */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {filteredTickets.length > 0 ? (
              <span>{filteredTickets.length} bilet</span>
            ) : (
              <span>Bilet bulunamadı</span>
            )}
          </div>
          {/* Aktif filtre varsa göster */}
          {getActiveFilterCount() > 0 && (
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs px-2 py-0 border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <FaFilter className="h-2 w-2 mr-1" />
                {getActiveFilterCount()} filtre
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Bilet Listesi */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          // Yükleniyor durumu
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-5 w-16" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full mb-4" />
                <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-px w-full mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Hata durumu
          <div className="p-4 flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 mb-3">
              <FaExclamationTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">Bir hata oluştu</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button size="sm" onClick={handleRefresh}>
              <FaSyncAlt className="mr-2 h-3.5 w-3.5" />
              Yeniden Dene
            </Button>
          </div>
        ) : filteredTickets.length === 0 ? (
          // Sonuç bulunamadı durumu
          <div className="p-4 flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500 mb-3">
              <FaTicketAlt className="h-6 w-6" />
            </div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">Bilet bulunamadı</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Arama kriterlerinize uygun bilet bulunamadı.' : 'Henüz bir bilet oluşturulmamış.'}
            </p>
            {searchTerm ? (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                <FaTimes className="mr-2 h-3.5 w-3.5" />
                Aramayı Temizle
              </Button>
            ) : null}
          </div>
        ) : (
          // Bilet listesi
          <div className="p-3">
            <AnimatePresence>
              {filteredTickets.map((ticket, index) => {
                // Bilet durumu ve önceliği için renk ve etiket belirle
                const status = ticket.status?.toLowerCase() || "new";
                const priority = ticket.priority?.toLowerCase() || "normal";

                const statusColor = STATUS_COLORS[status] || "bg-gray-500";
                const statusLabel = STATUS_LABELS[status] || "Bilinmiyor";

                const priorityColor = PRIORITY_COLORS[priority] || "bg-blue-500";
                const priorityLabel = PRIORITY_LABELS[priority] || "Normal";

                // Tarih ve ilgili bilgiler
                const createdAt = ticket.created_at || ticket.createdAt;
                const updatedAt = ticket.updated_at || ticket.updatedAt;
                const companyName = ticket.company_name || ticket.companyName || "Belirtilmemiş";
                const customerName = ticket.customer_name || ticket.customerName || "Belirtilmemiş";
                const assignedToName = ticket.assigned_to_name || ticket.assignedUserName || "Atanmamış";

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.98 }}
                    className="mb-3"
                  >
                    <div
                      className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm"
                      onClick={() => handleTicketClick(ticket.id, ticket.ticketno.toString())}
                    >
                      {/* Durum çizgisi */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`}></div>

                      {/* SLA ihlali uyarısı */}
                      {ticket.sla_breach && (
                        <div className="absolute right-0 top-0 w-0 h-0 border-t-[12px] border-r-[12px] border-red-500 z-10"></div>
                      )}

                      <div className="pl-3 pr-4 py-3">
                        {/* Üst kısım - ID ve etiketler */}
                        <div className="flex justify-between items-start mb-2.5">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
                            #{ticket.ticketno || ticket.id}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <Badge className={`${statusColor} text-white text-xs px-1.5 py-0 h-5`}>
                              {statusLabel}
                            </Badge>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={`${priorityColor} text-white text-xs px-1.5 py-0 h-5`}>
                                    <span className="flex items-center">
                                      {priority === "high" && <FaArrowUp className="h-2.5 w-2.5 mr-0.5" />}
                                      {priority === "low" && <FaArrowDown className="h-2.5 w-2.5 mr-0.5" />}
                                      {priorityLabel}
                                    </span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Öncelik: {priorityLabel}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        {/* Başlık */}
                        <h3 className="font-medium text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                          {ticket.title}
                        </h3>

                        {/* Bilgi kutusu */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 mb-2">
                          <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                            <div className="flex items-center">
                              <FaBuilding className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1.5" />
                              <span className="truncate text-gray-600 dark:text-gray-400">{companyName}</span>
                            </div>
                            <div className="flex items-center">
                              <FaHouseUser className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1.5" />
                              <span className="truncate text-gray-600 dark:text-gray-400">{customerName}</span>
                            </div>
                            <div className="flex items-center">
                              <FaTag className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1.5" />
                              <span className="truncate text-gray-600 dark:text-gray-400">{ticket.category_name || "Kategori yok"}</span>
                            </div>
                            <div className="flex items-center">
                              <FaUserTie className="h-3 w-3 flex-shrink-0 text-blue-500 mr-1.5" />
                              <span className="truncate font-medium text-blue-600 dark:text-blue-400">{assignedToName}</span>
                            </div>
                            {/* Kaynak Bilgisi */}
                            <div className="flex items-center">
                              {ticket.source && sourceConfig[ticket.source as keyof typeof sourceConfig] ? (
                                <>
                                  {React.createElement(sourceConfig[ticket.source as keyof typeof sourceConfig].icon, {
                                    className: "h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1.5"
                                  })}
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Kaynak: {sourceConfig[ticket.source as keyof typeof sourceConfig].label}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FaInbox className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1.5" />
                                  <span className="text-gray-600 dark:text-gray-400">Kaynak: -</span>
                                </>
                              )}
                            </div>
                            {/* Tarih Bilgisi */}
                            <div className="flex items-center">
                              <FaCalendarAlt className="h-3 w-3 flex-shrink-0 text-purple-500 mr-1.5" />
                              <span className="truncate font-medium text-purple-600 dark:text-purple-400">{createdAt ? format(new Date(createdAt), "dd.MM.yyyy HH:mm", { locale: tr }) : "-"}</span>
                            </div>
                            {/* SLA Bilgisi */}
                            {(ticket.due_date || ticket.dueDate) && (
                              <div className="flex items-center col-span-2">
                                <FaHourglassHalf className="h-3 w-3 flex-shrink-0 mr-1.5 text-amber-500" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  SLA: {calculateSlaTime(ticket.due_date || ticket.dueDate || "", !!ticket.sla_breach || !!ticket.slaBreach)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Alt kısım - Tarih bilgileri */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <span>Kayıt: {formatDate(createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <FaClock className="mr-1 h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <span>Son İşlem: {formatDate(updatedAt)}</span>
                          </div>
                        </div>

                        {/* Sağ ok */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-600">
                          <FaChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      {/* Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketId={selectedTicketId}
        ticketNo={selectedTicketNo}
      />
    </div>
  );
}