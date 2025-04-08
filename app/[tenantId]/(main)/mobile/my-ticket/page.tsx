"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTicketStore } from "@/stores/ticket-store";
import { useFilterStore } from "@/stores/filters-store";
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";
import { MobileTicketContainer } from "../components/TicketList";
import { toast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "../components/MobileNavigation/MobileMenu";
import { Menu } from "lucide-react";
import { getUserId } from "@/utils/user-utils";

export default function MobileTicketsPage() {
  const TAB_NAME = "my-ticket";

  const { activeTab, setActiveTab } = useTabStore();
  const { selectedFilter } = useFilterStore();
  const {
    getTickets,
    getFilters,
    setTickets,
    isLoading,
    setIsLoading,
    setFilters,
    clearTickets,
    isTabLoaded,
    shouldRefreshTab,
    addTicket,
    updateTicket
  } = useTicketStore();

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setHours(0, 0, 0, 0)), // Bugünün başlangıcı (00:00)
    to: new Date(new Date().setHours(23, 59, 59, 999)) // Bugünün sonu (23:59:59.999)
  });
  // Son istek zamanını takip etmek için ref
  const lastRequestRef = useRef<string>("");

  // Referanslar
  const hasInitializedRef = useRef(false);
  const appliedAtRef = useRef(selectedFilter.appliedAt);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Veri
  const tickets = getTickets(TAB_NAME);
  const filters = getFilters(TAB_NAME);

  // Veri yükle
  const fetchTickets = useCallback(async () => {
    console.log("fetchTickets called, active tab:", activeTab, "TAB_NAME:", TAB_NAME);
    
    // Aktif tab kontrolü
    if (activeTab !== TAB_NAME) {
      console.log("Active tab mismatch, not fetching tickets");
      return;
    }

    try {
      // Filtreleri al
      const latestFilter = useTabStore.getState().getTabFilter(TAB_NAME) || {};
      
      // Tarih formatını ayarla
      let fromDateStr, toDateStr;
      
      if (dateRange.from && dateRange.to) {
        // Tarihleri YYYY-MM-DD formatına dönüştür
        const fromDate = dateRange.from;
        
        // From tarihine +1 gün ekle
        const fromDatePlus1 = new Date(fromDate);
        fromDatePlus1.setDate(fromDatePlus1.getDate() + 1);
        
        const toDate = dateRange.to;
        
        // Tarih ve saat formatını ayarla (YYYY-MM-DD HH:MM)
        fromDateStr = `${fromDatePlus1.toISOString().split('T')[0]} 00:00`;
        toDateStr = `${toDate.toISOString().split('T')[0]} 23:59`;
      } else {
        // Varsayılan olarak bugünü kullan
        const today = new Date();
        
        // Bugüne +1 gün ekle
        const todayPlus1 = new Date(today);
        todayPlus1.setDate(todayPlus1.getDate() + 1);
        
        fromDateStr = `${todayPlus1.toISOString().split('T')[0]} 00:00`;
        toDateStr = `${today.toISOString().split('T')[0]} 23:59`;
      }
      
      // İstek parametrelerini oluştur
      const requestParams = {
        date1: fromDateStr,
        date2: toDateStr,
        userId: getUserId(),
        ...latestFilter
      };
      
      // İstek parametrelerini string olarak sakla
      const requestString = JSON.stringify(requestParams);
      
      // Eğer aynı parametrelerle istek zaten atıldıysa, tekrar istek atma
      if (requestString === lastRequestRef.current) {
        console.log("Skipping duplicate request with same parameters");
        return;
      }
      
      // İstek parametrelerini güncelle
      lastRequestRef.current = requestString;
      
      console.log("Date range for API request:", { date1: fromDateStr, date2: toDateStr });
      
      // Yükleme durumunu güncelle
      setIsLoading(true);
      setError(null);

      const response = await axios.post('/api/main/tickets/myticketsList', requestParams);

      if (response.data) {
        console.log("Tickets loaded:", response.data.length);
        setTickets(response.data, TAB_NAME);
      }
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setError(err.response?.data?.message || 'Destek talepleri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, TAB_NAME, setIsLoading, setTickets, setError, dateRange]);

  // Component ilk mount olduğunda çalışır
  useEffect(() => {
    // Sayfa yüklendiğinde activeTab'i güncelle
    setActiveTab(TAB_NAME);
    console.log("Setting active tab to:", TAB_NAME);

    // Eğer veri daha önce yüklenmemişse tickets state'ini temizle
    if (!isTabLoaded(TAB_NAME)) {
      clearTickets(TAB_NAME);
      console.log("Clearing tickets for tab:", TAB_NAME);
    }

    // Her zaman veri çek
    console.log("Initial load, fetching tickets");
    fetchTickets();
    
    // Sadece bir kez çalışacak işlemler
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log("First initialization complete");
    }
  }, [fetchTickets, TAB_NAME, clearTickets, isTabLoaded, setActiveTab]);

  // Filtre değişikliklerini işle
  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters, TAB_NAME);
  };

  // Tarih değişikliklerini işle
  const handleDateChange = (newDateRange: { from: Date | undefined; to: Date | undefined }) => {
    // Eğer tarihlerden biri tanımsızsa, bugünün tarihini kullan
    const updatedRange = {
      from: newDateRange.from || new Date(new Date().setHours(0, 0, 0, 0)),
      to: newDateRange.to || new Date(new Date().setHours(23, 59, 59, 999))
    };
    
    // Tarih değişikliğini state'e kaydet
    setDateRange(updatedRange);
    
    // Tarih değiştiğinde verileri yeniden yükle
    clearTickets(TAB_NAME);
    
    // Veri yükleme işlemini başlat
    fetchTickets();
  };

  // Filtre değişikliklerini izle
  useEffect(() => {
    // Filtre değişikliği kontrolü
    if (activeTab === TAB_NAME && selectedFilter.appliedAt !== appliedAtRef.current) {
      console.log("Filter changed, refreshing tickets");
      appliedAtRef.current = selectedFilter.appliedAt;
      clearTickets(TAB_NAME);
      fetchTickets();
    }
  }, [selectedFilter.appliedAt]);

  // refreshTicketList fonksiyonunu global window nesnesine ekle
  useEffect(() => {
    window.refreshTicketList = () => {
      // Tab verilerini temizle
      clearTickets(TAB_NAME);
      // Son yenileme zamanını sıfırla (clearTickets içinde zaten yapılıyor)
      return fetchTickets();
    };
  }, [fetchTickets]);

  return (
    <div className="flex flex-col h-[calc(110vh-4rem)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10 bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <img
            src={`${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/Audit.png`}
            alt="Logo"
            className="h-8 w-8"
          />
          <span className="font-semibold dark:text-gray-200">Support</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(true)}
          className="rounded-full"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileTicketContainer
        title="Benim Taleplerim"
        description="Bana ait destek taleplerini görüntüleyin ve yönetin"
        tickets={tickets}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchTickets}
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
