"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useTicketStore } from "@/stores/ticket-store"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { TicketHeader } from "../components/TicketHeader"
import { TicketFilters } from "../components/TicketFilters"
import { TicketList } from "../components/TicketList"
import { TicketPagination } from "../components/TicketPagination"
import { Ticket } from "@/types/tickets"

// Window nesnesine refreshTicketList fonksiyonunu eklemek için TypeScript tanımlaması
declare global {
    interface Window {
        refreshTicketList: () => Promise<void>;
    }
}

export default function ResolvedTicketsPage() {
    const TAB_NAME = "Çözülen Talepler"
    const { activeTab, setActiveTab } = useTabStore()
    const { selectedFilter } = useFilterStore()
    const { 
        getTickets, 
        getFilters,
        setTickets, 
        isLoading, 
        setIsLoading, 
        setFilters, 
        clearTickets,
        isTabLoaded,
        shouldRefreshTab
    } = useTicketStore()
    
    // UI State
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [error, setError] = useState<string | null>(null)
    const itemsPerPage = 10
    
    // Referanslar
    const hasInitializedRef = useRef(false)
    const appliedAtRef = useRef(selectedFilter.appliedAt)
    
    // Veri
    const tickets = getTickets(TAB_NAME)
    const filters = getFilters(TAB_NAME)
    
    // Component ilk mount olduğunda çalışır
    useEffect(() => {
        // Sayfa yüklendiğinde activeTab'i güncelle
        setActiveTab(TAB_NAME)
        
        // Eğer veri daha önce yüklenmemişse tickets state'ini temizle
        if (!isTabLoaded(TAB_NAME)) {
            clearTickets(TAB_NAME)
        }
        
        // Status filtrelerini ayarla
        setFilters({
            ...filters,
            status: ['resolved', 'closed']
        }, TAB_NAME);
        
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            
            // Aktif tab bu sayfa ise veri çek
            if (activeTab === TAB_NAME) {
                fetchTickets()
            }
        }
    }, [])

    // Verileri yükle
    const fetchTickets = useCallback(async () => {
        // Aktif tab kontrolü
        if (activeTab !== TAB_NAME) {
            return
        }

        // Eğer veri daha önce yüklenmişse ve son yenilemeden bu yana 90 saniye geçmediyse tekrar istek atma
        if (isTabLoaded(TAB_NAME) && tickets.length > 0 && !shouldRefreshTab(TAB_NAME)) {
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            const latestFilter = useTabStore.getState().getTabFilter(activeTab)

            const response = await axios.post('/api/main/tickets/resolved-ticket', {
                date1: latestFilter?.date?.from || '2020-01-01',
                date2: latestFilter?.date?.to || new Date().toISOString(),
            })
            
            if (response.data) {
                // API'den gelen verileri doğrudan kullan, tekrar filtreleme yapma
                setTickets(response.data, TAB_NAME)
            }
        } catch (err: any) {
            console.error('Error loading tickets:', err)
            setError(err.response?.data?.message || 'Destek talepleri yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, tickets.length, TAB_NAME])

    // Sadece filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (activeTab === TAB_NAME && selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            clearTickets(TAB_NAME)
            fetchTickets()
        }
    }, [selectedFilter.appliedAt])

    // Gelişmiş filtreleme fonksiyonu
    const applyFilters = useCallback((ticket: Ticket) => {
        // Arama terimi filtrelemesi - tüm kolonları dahil et
        const searchMatch = !searchTerm || 
            // Temel bilet bilgileri
            (ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.ticketno?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // Firma ve müşteri bilgileri
            ((ticket.company_name || ticket.companyName)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            ((ticket.company_id || ticket.companyId)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            ((ticket.parent_company_id || ticket.parentCompanyId)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // Müşteri bilgileri
            ((ticket.customer_name || ticket.customerName)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            ((ticket.customer_email || ticket.customerEmail)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            ((ticket.customer_phone || ticket.customerPhone)?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // İletişim bilgileri
            (ticket.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.contact_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.contact_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.contact_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.contact_position?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // Kategori bilgileri
            (ticket.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.subcategory_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // Atanan kişi bilgileri
            (ticket.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (ticket.assignedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            
            // Oluşturan kişi bilgileri
            (ticket.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        
        // Öncelik filtrelemesi
        const priorityMatch = !filters.priority?.length || 
            (ticket.priority && filters.priority.includes(ticket.priority));
        
        // Status filtrelemesi
        const statusMatch = !filters.status?.length || 
            (ticket.status && (
                // Doğrudan eşleşme kontrolü
                filters.status.includes(ticket.status) ||
                // "Beklemede" durumu için özel kontrol
                (filters.status.includes("pending") && ticket.status === "waiting")
            ));
        
        // Atanan kullanıcı filtrelemesi - hem assigned_to hem de assignedTo alanlarını kontrol et
        const assignedToMatch = !filters.assigned_to?.length || 
            ((ticket.assigned_to || ticket.assignedTo) && 
             filters.assigned_to.some(id => id === ticket.assigned_to || id === ticket.assignedTo));
        
        // Kategori filtrelemesi
        const categoryMatch = !filters.category?.length || 
            ((ticket.category_id || ticket.categoryId) && 
             filters.category.some(id => id === ticket.category_id || id === ticket.categoryId));
        
        // Şirket filtrelemesi
        const companyMatch = !filters.company_id?.length || 
            ((ticket.company_id || ticket.companyId) && 
             filters.company_id.some(id => id === ticket.company_id || id === ticket.companyId));
        
        // Ana şirket filtrelemesi
        const parentCompanyMatch = !filters.parent_company_id?.length || 
            ((ticket.parent_company_id || ticket.parentCompanyId) && 
             filters.parent_company_id.some(id => id === ticket.parent_company_id || id === ticket.parentCompanyId));
        
        // SLA ihlali filtrelemesi
        const slaBreachMatch = filters.sla_breach === undefined || 
            (ticket.sla_breach ?? ticket.slaBreach) === filters.sla_breach;
        
        // Tüm filtrelerden geçen biletleri döndür
        return searchMatch && priorityMatch && statusMatch && assignedToMatch && 
               categoryMatch && companyMatch && parentCompanyMatch && 
               slaBreachMatch;
    }, [searchTerm, filters]);

    // Filtreleri uygula
    const filteredTickets = tickets.filter(applyFilters);

    // Sayfalama
    const totalTickets = filteredTickets.length
    const totalPages = Math.ceil(totalTickets / itemsPerPage)
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Filtre değişikliklerini işle
    const handleFilterChange = (newFilters: any) => {
        // Status filtresini koruyarak diğer filtreleri güncelle
        const updatedFilters = { 
            ...filters, 
            ...newFilters
        };
        
        // Eğer status filtresi boş ise veya resolved/closed dışında bir değer içeriyorsa
        // varsayılan olarak hem resolved hem de closed durumlarını ekle
        if (!updatedFilters.status || updatedFilters.status.length === 0) {
            updatedFilters.status = ['resolved', 'closed'];
        } else if (updatedFilters.status.length === 1) {
            // Kullanıcı bir durum seçtiyse, seçimini koru
            // Ancak sadece resolved veya closed olduğundan emin ol
            const selectedStatus = updatedFilters.status[0];
            if (selectedStatus !== 'resolved' && selectedStatus !== 'closed') {
                updatedFilters.status = ['resolved', 'closed'];
            }
        }
        
        setFilters(updatedFilters, TAB_NAME);
        setCurrentPage(1); // Reset to first page when filters change
        // Filtreler değiştiğinde verileri tekrar yükleme, sadece filtreleri uygula
        // clearTickets(TAB_NAME);
    }

    // refreshTicketList fonksiyonunu global window nesnesine ekle
    useEffect(() => {
        window.refreshTicketList = () => {
            // Tab verilerini temizle
            clearTickets(TAB_NAME)
            // Son yenileme zamanını sıfırla (clearTickets içinde zaten yapılıyor)
            return fetchTickets()
        };
    }, [fetchTickets]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <TicketHeader 
                title="Çözülen Talepler" 
                description="Çözümlenmiş tüm destek taleplerini görüntüleyin ve yönetin." 
            />
            
            <TicketFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                showOnlyResolvedClosedStatus={true}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden">
                    <TicketList 
                        tickets={paginatedTickets}
                        isLoading={isLoading}
                        error={error}
                        onTicketDeleted={() => {
                            clearTickets(TAB_NAME)
                            fetchTickets()
                        }}
                    />
                    
                    <TicketPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalTickets={totalTickets}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    )
}
