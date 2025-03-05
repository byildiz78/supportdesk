"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { TicketList } from "../components/TicketList"
import { TicketHeader } from "../components/TicketHeader"
import { TicketFilters } from "../components/TicketFilters"
import { TicketPagination } from "../components/TicketPagination"
import { useTicketStore } from "@/stores/ticket-store"

export default function AllTicketsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const { tickets, isLoading } = useTicketStore()

    // Filter tickets based on search term
    const filteredTickets = tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalTickets = filteredTickets.length
    const totalPages = Math.ceil(totalTickets / itemsPerPage)
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <TicketHeader />
            
            <TicketFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <TicketList 
                        tickets={paginatedTickets}
                        isLoading={isLoading}
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