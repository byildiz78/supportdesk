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
  FaTicketAlt
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

interface MobileTicketContainerProps {
  title: string;
  description: string;
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  filters: Record<string, any>;
  onFilterChange: (newFilters: any) => void;
}

export function MobileTicketContainer({
  title,
  description,
  tickets,
  isLoading,
  error,
  onRefresh,
  filters,
  onFilterChange
}: MobileTicketContainerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/80 dark:bg-gray-900">
      {/* Başlık ve Açıklama - sticky özelliği kaldırıldı */}
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
