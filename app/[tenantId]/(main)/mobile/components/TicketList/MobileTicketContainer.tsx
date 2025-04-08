"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileTicketList } from "./MobileTicketList";
import { Ticket } from "@/types/tickets";
import {
  FaFilter,
  FaTimes,
  FaPlus,
  FaSyncAlt,
  FaEllipsisV,
  FaChevronRight,
  FaTicketAlt,
  FaCalendarAlt
} from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { MobileFilterPanel } from "../MobileFilter/MobileFilterPanel";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface MobileTicketContainerProps {
  title: string;
  description: string;
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  filters: Record<string, any>;
  onFilterChange: (newFilters: any) => void;
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
}

export function MobileTicketContainer({
  title,
  description,
  tickets,
  isLoading,
  error,
  onRefresh,
  filters,
  onFilterChange,
  dateRange,
  onDateChange
}: MobileTicketContainerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Bilet detayına git
  const handleTicketClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  // Yeni bilet oluştur
  const handleCreateTicket = () => {
    router.push('/tickets/new');
  };

  // Yenileme işlemi
  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    // Status filtresi hariç diğer filtreleri temizle
    const statusFilter = filters.status ? { status: filters.status } : {};
    onFilterChange(statusFilter);
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

  const activeFilterCount = getActiveFilterCount();

  // Tarih aralığı state'i
  const [dateRangeState, setDateRangeState] = useState<DateRange>({
    from: dateRange.from,
    to: dateRange.to
  });

  // Tarih aralığı formatını oluştur
  const formatDateRange = () => {
    if (!dateRangeState.from) return "Tarih seçilmedi";
    
    if (!dateRangeState.to) {
      return format(dateRangeState.from, "dd.MM.yyyy", { locale: tr });
    }
    
    // Aynı gün içindeyse tek tarih göster
    if (dateRangeState.from.toDateString() === dateRangeState.to.toDateString()) {
      return format(dateRangeState.from, "dd.MM.yyyy", { locale: tr });
    }
    
    return `${format(dateRangeState.from, "dd.MM.yyyy", { locale: tr })} - ${format(dateRangeState.to, "dd.MM.yyyy", { locale: tr })}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/80 dark:bg-gray-900">
      {/* Tarih Filtresi */}
      <div className="px-4 py-3 border-b dark:border-gray-800">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                <span>{formatDateRange()}</span>
              </div>
              <FaChevronRight className={`transition-transform ${isDatePickerOpen ? "rotate-90" : ""}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRangeState.from || undefined,
                to: dateRangeState.to || undefined
              }}
              onSelect={(range) => {
                // Kullanıcının seçtiği tarih aralığını al
                const newRange = {
                  from: range?.from ? new Date(range.from.setHours(0, 0, 0, 0)) : undefined,
                  to: range?.to ? new Date(range.to.setHours(23, 59, 59, 999)) : undefined
                };
                
                // Tek gün seçilmişse (from var ama to yok)
                if (newRange.from && !newRange.to) {
                  // Aynı günü hem başlangıç hem bitiş olarak ayarla
                  newRange.to = new Date(newRange.from);
                  newRange.to.setHours(23, 59, 59, 999);
                }
                
                // State'i güncelle ve callback'i çağır
                setDateRangeState(newRange);
                onDateChange(newRange);
              }}
              disabled={{ after: new Date() }}
              initialFocus
              className="rounded-md border dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            />
            <div className="p-3 border-t flex justify-between dark:border-gray-700">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateRangeState({ from: undefined, to: undefined });
                  setIsDatePickerOpen(false);
                  onDateChange({ from: undefined, to: undefined });
                }}
                className="text-red-500 dark:text-red-400"
              >
                Temizle
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
                  
                  setDateRangeState({
                    from: startOfDay,
                    to: endOfDay
                  });
                  setIsDatePickerOpen(false);
                  onDateChange({ from: startOfDay, to: endOfDay });
                }}
                className="text-blue-500 dark:text-blue-400"
              >
                Bugün
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Bilet Listesi */}
      <Card className="flex-1 overflow-hidden border-0 shadow-none bg-transparent">
        <MobileTicketList
          tickets={tickets}
          title={title}
          description={description}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onRefresh={handleRefresh}
          onFilterClick={() => setIsFilterOpen(true)}
        />
      </Card>
    </div>
  );
}
