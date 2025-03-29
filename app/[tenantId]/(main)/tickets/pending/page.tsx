"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { TicketList } from "../components/TicketList"
import { TicketHeader } from "../components/TicketHeader"
import { TicketFilters } from "../components/TicketFilters"
import { TicketPagination } from "../components/TicketPagination"
import { useTicketStore } from "@/stores/ticket-store"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"

// Window nesnesine refreshTicketList fonksiyonunu eklemek için TypeScript tanımlaması
declare global {
    interface Window {
        refreshTicketList: () => Promise<void>;
    }
}

export default function PendingTicketsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [error, setError] = useState<string | null>(null)

    const { tickets, setTickets, isLoading, setIsLoading, filters, setFilters } = useTicketStore()
    const { selectedFilter } = useFilterStore()

    // Set initial filter to show only pending tickets
    useEffect(() => {
        // Save the previous filters
        const previousFilters = { ...filters };
        
        // Set filters to show only pending tickets
        setFilters({ ...filters, status: ["pending"] });
        
        // Cleanup function to reset filters when component unmounts
        return () => {
            // Reset status filter when navigating away
            setFilters({ ...filters, status: previousFilters.status || [] });
        };
    }, []);

    // Fetch tickets from API
    const fetchTickets = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            // Get tenant ID from selected branches
            let branchParam = selectedFilter.selectedBranches.length > 0
                ? selectedFilter.selectedBranches
                : selectedFilter.branches

            // Prepare value for API
            if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
                // Send empty array, not null
                branchParam = []
            }
            
            const response = await axios.post('/api/main/tickets/ticketsList', {
                tenantId: branchParam,
                filters: filters
            })
            
            if (response.data) {
                setTickets(response.data)
            }
        } catch (err: any) {
            console.error('Error loading tickets:', err)
            setError(err.response?.data?.message || 'Destek talepleri yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }, [selectedFilter.selectedBranches, selectedFilter.branches, setTickets, setIsLoading, setError, filters])

    // Load tickets on component mount and when filters change
    useEffect(() => {
        fetchTickets()
    }, [fetchTickets, filters])

    // Filter tickets based on search term
    const filteredTickets = tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketno?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.parent_company_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalTickets = filteredTickets.length
    const totalPages = Math.ceil(totalTickets / itemsPerPage)
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Handle filter changes
    const handleFilterChange = (newFilters: any) => {
        // Always keep the status as "pending"
        const updatedFilters = { 
            ...filters, 
            ...newFilters,
            status: ["pending"] // Ensure status is always "pending"
        };
        setFilters(updatedFilters);
        setCurrentPage(1); // Reset to first page when filters change
    }

    // Expose refresh function to window for external calls
    useEffect(() => {
        window.refreshTicketList = fetchTickets;
        
        return () => {
            // @ts-ignore
            window.refreshTicketList = undefined;
        };
    }, [fetchTickets])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <TicketHeader 
                title="Bekleyen Talepler" 
                description="Beklemede olan tüm destek taleplerini görüntüleyin ve yönetin." 
            />
            
            <TicketFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                disableStatusFilter={true}
            />
            
            {error && (
                <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </Card>
            )}
            
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <TicketList 
                        tickets={paginatedTickets} 
                        isLoading={isLoading}
                        error={error}
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
