"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { Table, TableBody } from "@/components/ui/table"
import axios from "@/lib/axios"
import { toast } from "@/components/ui/toast/use-toast"
import { Ticket } from "@/types/tickets"
import { useTabStore } from "@/stores/tab-store"
import { clearTicketCache } from "../detail/page"

// Import our new components
import { TicketListHeader, SortField, SortDirection } from "./ticket-list/TicketListHeader"
import { TicketRow } from "./ticket-list/TicketRow"
import { TicketDeleteDialog } from "./ticket-list/TicketDeleteDialog"
import { TicketEmptyState } from "./ticket-list/TicketEmptyState"
import { TicketLoadingState } from "./ticket-list/TicketLoadingState"
import { TicketErrorState } from "./ticket-list/TicketErrorState"
import { sortTickets } from "./ticket-list/ticket-sort-utils"
import { usePathname } from "next/navigation"
import { StatusHistoryService } from "@/app/[tenantId]/(main)/services/status-history-service"
import { useTicketStore } from "@/stores/ticket-store"
import { getUserId } from "@/utils/user-utils"

interface TicketListProps {
    tickets: Ticket[]
    isLoading: boolean
    error?: string | null
    onTicketDeleted?: () => void
    showStatusColumn?: boolean
}

export function TicketList({ tickets, isLoading, error, onTicketDeleted = () => { }, showStatusColumn = true }: TicketListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [sortField, setSortField] = useState<SortField>('ticketno')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [userdata, setUserdata] = useState({ name: "", email: "", usercategory: "", userrole: "" })
    const pathname = usePathname();
    const tenantId = pathname?.split("/")[1] || "";
    const {deleteTicket} = useTicketStore();

    useEffect(() => {
        const storedUserData = localStorage.getItem(`userData_${tenantId}`);
        if (storedUserData) {
            setUserdata(JSON.parse(storedUserData));
        }
    }, [tenantId]);


    // Handle ticket actions
    const handleViewTicket = (ticket: Ticket) => {
        const tabId = `ticket-${ticket.id}`

        // Önce bu ID'ye sahip bir tab var mı kontrol et
        const tabs = useTabStore.getState().tabs
        const existingTab = tabs.find(tab => tab.id === tabId)

        // Her tıklamada önbelleği temizle, böylece her zaman API'den taze veri alınacak
        clearTicketCache(tabId)

        if (existingTab) {
            // Tab zaten açıksa, sadece o taba geçiş yap
            setActiveTab(tabId)
        } else {
            // Tab yoksa yeni tab oluştur
            addTab({
                id: tabId,
                title: `Talep #${ticket.ticketno}`,
                lazyComponent: () => import('../detail/page').then(module => ({
                    default: (props: any) => <module.default {...props} ticketId={ticket.id} />
                }))
            })
            setActiveTab(tabId)
        }
    }

    const handleEditTicket = (ticket: Ticket) => {
        const tabId = `edit-ticket-${ticket.id}`

        // Önce bu ID'ye sahip bir tab var mı kontrol et
        const tabs = useTabStore.getState().tabs
        const existingTab = tabs.find(tab => tab.id === tabId)

        if (existingTab) {
            // Tab zaten açıksa, sadece o taba geçiş yap
            setActiveTab(tabId)
        } else {
            // Tab yoksa yeni tab oluştur
            addTab({
                id: tabId,
                title: `Talep #${ticket.ticketno} (Düzenle)`,
                lazyComponent: () => import('../crud-update/page').then(module => ({
                    default: (props: any) => <module.default {...props} ticketId={ticket.id} />
                }))
            })
            setActiveTab(tabId)
        }
    }

    const handleDeleteClick = (ticket: Ticket) => {
        setTicketToDelete(ticket)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!ticketToDelete) return

        const userId = getUserId();
        try {
            setIsDeleting(true)
            await axios.post('/api/main/tickets/deleteTicket', {
                id: ticketToDelete.id,
                updatedBy: userId
            })

            // Durum geçmişi tablosuna kaydet
            try {
                await StatusHistoryService.createStatusHistoryEntry(
                    ticketToDelete.id,
                    ticketToDelete.status,
                    "deleted"
                );
            } catch (error) {
                toast({
                    title: "Hata",
                    description: "Destek talebi kayıt edilmedi",
                    variant: "destructive",
                })
            }

            toast({
                title: "Başarılı",
                description: "Destek talebi başarıyla silindi",
                variant: "default",
            })
            deleteTicket(ticketToDelete.id)
            // onTicketDeleted()
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
            <div className="flex-1 overflow-auto overflow-x-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                        <Table className="min-w-full table-fixed">
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
                                            userRole={userdata.userrole}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
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
