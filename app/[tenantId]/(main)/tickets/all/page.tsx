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

export default function AllTicketsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [error, setError] = useState<string | null>(null)

    const { tickets, setTickets, isLoading, setIsLoading, filters, setFilters } = useTicketStore()
    const { selectedFilter } = useFilterStore()

    // Reset any status filters when component mounts
    useEffect(() => {
        // If status filter is set (from another page), reset it
        if (filters.status && filters.status.length > 0) {
            const { status, ...otherFilters } = filters;
            setFilters(otherFilters);
        }
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
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        setCurrentPage(1); // Reset to first page when filters change
    }

    // Add refreshTicketList function to global window object
    useEffect(() => {
        window.refreshTicketList = fetchTickets;
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
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <TicketList 
                        tickets={paginatedTickets}
                        isLoading={isLoading}
                        error={error}
                        onTicketDeleted={fetchTickets}
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
