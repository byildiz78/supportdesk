"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTicketStore } from "@/stores/ticket-store";
import { useFilterStore } from "@/stores/filters-store";
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";
import { MobileTicketContainer } from "../components/TicketList";
import { useEventSource } from "@/hooks/useEventSource";
import { toast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "../components/MobileNavigation/MobileMenu";
import { Menu } from "lucide-react";

export default function MobileTicketsPage() {
  const TAB_NAME = "operationdesk";
  const pathname = usePathname();
  const tenantId = pathname?.split('/')[1] || "";

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

  // Referanslar
  const hasInitializedRef = useRef(false);
  const appliedAtRef = useRef(selectedFilter.appliedAt);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // SSE bağlantısı
  const { isConnected, addEventListener, removeEventListener } = useEventSource();

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
      setIsLoading(true);
      setError(null);
      
      // Filtreleri al
      const latestFilter = useTabStore.getState().getTabFilter(TAB_NAME) || {};
      console.log("Fetching tickets with filter:", latestFilter);

      const response = await axios.post('/api/main/operationdesk', {
        date1: selectedFilter?.date?.from || '2020-01-01',
        date2: selectedFilter?.date?.to || new Date().toISOString(),
      });

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
  }, [activeTab, TAB_NAME, setIsLoading, setTickets, setError]);

  // SSE olaylarını dinle
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleTicketUpdate = (data: any) => {
      if (!data || !data.ticket) {
        console.error('Geçersiz ticket verisi:', data);
        return;
      }

      if (data.action === 'create') {
        toast({
          title: "Yeni Talep",
          description: `Yeni talep oluşturuldu: #${data.ticket.ticketno || data.ticket.id}`,
          variant: "default",
          className: "bg-green-100 border-green-500 text-green-800",
        });

        addTicket(data.ticket, TAB_NAME);
      } else if (data.action === 'update') {
        // Eğer callcount güncellemesi ise özel bir mesaj göster
        if (data.updateType === 'callcount') {
          toast({
            title: "Aranma Sayısı Güncellendi",
            description: `Talep #${data.ticket.ticketno}: Aranma sayısı ${data.ticket.callcount} olarak güncellendi`,
            variant: "default",
            className: "bg-blue-100 border-blue-500 text-blue-800",
          });
        } else {
          toast({
            title: "Talep Güncellendi",
            description: `Talep güncellendi: #${data.ticket.ticketno || data.ticket.id}`,
            variant: "default",
            className: "bg-blue-100 border-blue-500 text-blue-800",
          });
        }

        // Her durumda ticket'ı güncelle
        updateTicket(data.ticket);
      }
    };

    // Event listener'ı ekle
    addEventListener('ticket-update', handleTicketUpdate);

    // Cleanup
    return () => {
      removeEventListener('ticket-update', handleTicketUpdate);
    };
  }, [isConnected, addEventListener, removeEventListener, addTicket, updateTicket, TAB_NAME]);

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
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10 bg-white">
        <div className="flex items-center gap-2">
          <img
            src={`${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/Audit.png`}
            alt="Logo"
            className="h-8 w-8"
          />
          <span className="font-semibold">robotPOS Support</span>
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
        title="Operasyon Destek Talepleri"
        description="Operasyon destek taleplerini görüntüleyin ve yönetin"
        tickets={tickets}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchTickets}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
