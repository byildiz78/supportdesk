"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useTicketStore } from "@/stores/ticket-store"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { getUserId } from "@/utils/user-utils"
import { TicketHeader } from "../components/TicketHeader"
import { TicketFilters } from "../components/TicketFilters"
import { TicketList } from "../components/TicketList"
import { TicketPagination } from "../components/TicketPagination"

// Window nesnesine refreshTicketList fonksiyonunu eklemek için TypeScript tanımlaması
declare global {
    interface Window {
        refreshTicketList: () => Promise<void>;
    }
}

export default function MyTicketsPage() {
    const TAB_NAME = "Benim Taleplerim"
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
            const userId = getUserId()

            const response = await axios.post('/api/main/tickets/myticketsList', {
                date1: latestFilter?.date?.from || '2020-01-01',
                date2: latestFilter?.date?.to || new Date().toISOString(),
                userId
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

    // Filter tickets based on search term
    const filteredTickets = tickets.filter(ticket => 
        !searchTerm || // Eğer arama terimi yoksa tüm biletleri göster
        ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketno?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.parent_company_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sayfalama
    const totalTickets = filteredTickets.length
    const totalPages = Math.ceil(totalTickets / itemsPerPage)
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Filtre değişikliklerini işle
    const handleFilterChange = (newFilters: any) => {
        const updatedFilters = { ...filters, ...newFilters };
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
            <TicketHeader />
            
            <TicketFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
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
