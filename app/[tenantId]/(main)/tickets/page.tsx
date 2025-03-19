"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useTicketStore } from "@/stores/ticket-store"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { TicketHeader } from "./components/TicketHeader"
import { TicketFilters } from "./components/TicketFilters"
import { TicketList } from "./components/TicketList"
import { TicketPagination } from "./components/TicketPagination"
import { Ticket } from "@/types/tickets"

// Window nesnesine refreshTicketList fonksiyonunu eklemek için TypeScript tanımlaması
declare global {
    interface Window {
        refreshTicketList: () => Promise<void>;
    }
}

export default function AllTicketsPage() {
    const TAB_NAME = "Tüm Talepler"
    const { activeTab, setActiveTab } = useTabStore()
    const { selectedFilter } = useFilterStore()
    const { 
        getTickets, 
        setTickets, 
        isLoading, 
        setIsLoading, 
        filters, 
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

    // Component ilk mount olduğunda çalışır
    useEffect(() => {
        // Sayfa yüklendiğinde activeTab'i güncelle
        setActiveTab(TAB_NAME)
        
        // Eğer veri daha önce yüklenmemişse tickets state'ini temizle
        if (!isTabLoaded(TAB_NAME)) {
            clearTickets(TAB_NAME)
        }
        
        // Status filtrelerini sıfırla
        if (filters.status && filters.status.length > 0) {
            const { status, ...otherFilters } = filters;
            setFilters(otherFilters);
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

            const response = await axios.post('/api/main/tickets/ticketsList', {
                date1: latestFilter?.date?.from || '2020-01-01',
                date2: latestFilter?.date?.to || new Date().toISOString(),
            })
            
            if (response.data) {
                setTickets(response.data, TAB_NAME)
                // Son yenileme zamanını güncelle (setTickets içinde zaten yapılıyor)
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

    // Verileri filtrele
    const applyFilters = (tickets: Ticket[]) => {
        let filtered = [...tickets];
        
        // Status filter
        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter(ticket => 
                filters.status!.includes(ticket.status)
            );
        }
        
        // Priority filter
        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter(ticket => 
                filters.priority!.includes(ticket.priority)
            );
        }
        
        // Category filter
        if (filters.category && filters.category.length > 0) {
            filtered = filtered.filter(ticket => {
                const categoryId = ticket.category_id || ticket.categoryId;
                return categoryId && filters.category!.includes(categoryId);
            });
        }
        
        // Subcategory filter
        if (filters.subcategory && filters.subcategory.length > 0) {
            filtered = filtered.filter(ticket => {
                const subcategoryId = ticket.subcategory_id || ticket.subcategoryId;
                return subcategoryId && filters.subcategory!.includes(subcategoryId);
            });
        }
        
        // Group filter
        if (filters.group && filters.group.length > 0) {
            filtered = filtered.filter(ticket => {
                const groupId = ticket.group_id || ticket.groupId;
                return groupId && filters.group!.includes(groupId);
            });
        }
        
        // Assigned to filter
        if (filters.assigned_to && filters.assigned_to.length > 0) {
            filtered = filtered.filter(ticket => {
                // Hem snake_case hem de camelCase versiyonları kontrol et
                const assignedTo = ticket.assigned_to || ticket.assignedTo;
                return assignedTo && filters.assigned_to!.includes(assignedTo);
            });
        }
        
        // Parent company filter
        if (filters.parent_company_id && filters.parent_company_id.length > 0) {
            filtered = filtered.filter(ticket => {
                const parentCompanyId = ticket.parent_company_id || ticket.parentCompanyId;
                return parentCompanyId && filters.parent_company_id!.includes(parentCompanyId);
            });
        }
        
        // Company filter
        if (filters.company_id && filters.company_id.length > 0) {
            filtered = filtered.filter(ticket => {
                const companyId = ticket.company_id || ticket.companyId;
                return companyId && filters.company_id!.includes(companyId);
            });
        }
        
        // Contact filter
        if (filters.contact_id && filters.contact_id.length > 0) {
            filtered = filtered.filter(ticket => {
                const contactId = ticket.contact_id || ticket.contactId;
                return contactId && filters.contact_id!.includes(contactId);
            });
        }
        
        // SLA breach filter
        if (filters.sla_breach !== undefined) {
            filtered = filtered.filter(ticket => 
                ticket.sla_breach === filters.sla_breach
            );
        }
        
        // Search term filter
        if (searchTerm) {
            filtered = filtered.filter(ticket => 
                (ticket.title && ticket.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.ticketno && ticket.ticketno.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.parent_company_id && ticket.parent_company_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.parentCompanyId && ticket.parentCompanyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.company_name && ticket.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.companyName && ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.customer_name && ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ticket.customerName && ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        return filtered;
    }

    // Filtreleri uygula
    const filteredTickets = applyFilters(tickets);

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
        setFilters(updatedFilters);
        setCurrentPage(1); // Reset to first page when filters change
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
