"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Table, TableBody } from "@/components/ui/table"
import axios from "@/lib/axios"
import { toast } from "@/components/ui/toast/use-toast"
import { Ticket } from "@/types/tickets"
import { useTabStore } from "@/stores/tab-store"

// Import our new components
import { TicketListHeader, SortField, SortDirection } from "./ticket-list/TicketListHeader"
import { TicketRow } from "./ticket-list/TicketRow"
import { TicketDeleteDialog } from "./ticket-list/TicketDeleteDialog"
import { TicketEmptyState } from "./ticket-list/TicketEmptyState"
import { TicketLoadingState } from "./ticket-list/TicketLoadingState"
import { TicketErrorState } from "./ticket-list/TicketErrorState"
import { sortTickets } from "./ticket-list/ticket-sort-utils"

interface TicketListProps {
    tickets: Ticket[]
    isLoading: boolean
    error?: string | null
    onTicketDeleted?: () => void
    showStatusColumn?: boolean
}

export function TicketList({ tickets, isLoading, error, onTicketDeleted = () => {}, showStatusColumn = true }: TicketListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [sortField, setSortField] = useState<SortField>('ticketno')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Handle ticket actions
    const handleViewTicket = (ticket: Ticket) => {
        const tabId = `ticket-${ticket.id}`
        addTab({
            id: tabId,
            title: `Talep #${ticket.ticketno}`,
            lazyComponent: () => import('../detail/page').then(module => ({
                default: (props: any) => <module.default {...props} ticketId={ticket.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleEditTicket = (ticket: Ticket) => {
        const tabId = `edit-ticket-${ticket.id}`
        addTab({
            id: tabId,
            title: `Talep #${ticket.ticketno} (Düzenle)`,
            lazyComponent: () => import('../new/page').then(module => ({
                default: (props: any) => <module.default {...props} ticketId={ticket.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleDeleteClick = (ticket: Ticket) => {
        setTicketToDelete(ticket)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!ticketToDelete) return

        try {
            setIsDeleting(true)
            await axios.post('/api/main/tickets/deleteTicket', {
                id: ticketToDelete.id
            })
            toast({
                title: "Başarılı",
                description: "Destek talebi başarıyla silindi",
                variant: "default",
            })
            onTicketDeleted()
        } catch (error) {
            console.error('Destek talebi silinirken hata:', error)
            toast({
                title: "Hata",
                description: "Destek talebi silinemedi",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setTicketToDelete(null)
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            // Set new field and default to ascending
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Sort tickets based on current sort field and direction
    const sortedTickets = useMemo(() => 
        sortTickets(tickets, sortField, sortDirection), 
        [tickets, sortField, sortDirection]
    )

    if (error) {
        return <TicketErrorState error={error} />
    }

    return (
        <>
            <div className="flex-1 overflow-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                <Table>
                    <TicketListHeader 
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />
                    <TableBody>
                        {isLoading ? (
                            <TicketLoadingState />
                        ) : sortedTickets.length === 0 ? (
                            <TicketEmptyState />
                        ) : (
                            sortedTickets.map(ticket => (
                                <TicketRow 
                                    key={ticket.id}
                                    ticket={ticket}
                                    onView={handleViewTicket}
                                    onEdit={handleEditTicket}
                                    onDelete={handleDeleteClick}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TicketDeleteDialog 
                ticket={ticketToDelete}
                open={deleteDialogOpen}
                isDeleting={isDeleting}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}
