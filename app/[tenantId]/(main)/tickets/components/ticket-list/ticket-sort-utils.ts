import { Ticket } from "@/types/tickets"
import { SortDirection, SortField } from "./TicketListHeader"

export function sortTickets(tickets: Ticket[], sortField: SortField, sortDirection: SortDirection): Ticket[] {
    if (!tickets) return []
    
    return [...tickets].sort((a, b) => {
        let aValue: any
        let bValue: any
        
        // Special handling for fields that are not directly on the ticket object
        if (sortField === 'assignedUserName') {
            aValue = a.assignedUserName || ''
            bValue = b.assignedUserName || ''
        } else if (sortField === 'customerName') {
            aValue = a.customerName || ''
            bValue = b.customerName || ''
        } else if (sortField === 'elapsedTime') {
            // Geçen süre için createdAt tarihini kullan
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
        } else if (sortField === 'callcount') {
            aValue = a.callcount || 0
            bValue = b.callcount || 0
        } else {
            aValue = a[sortField as keyof Ticket]
            bValue = b[sortField as keyof Ticket]
        }
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = ''
        if (bValue === null || bValue === undefined) bValue = ''
        
        // For numeric fields
        if (sortField === 'ticketno' || sortField === 'callcount') {
            return sortDirection === 'asc' 
                ? Number(aValue) - Number(bValue)
                : Number(bValue) - Number(aValue)
        }
        
        // For date fields
        if (sortField === 'createdAt' || sortField === 'dueDate' || sortField === 'elapsedTime') {
            const dateA = typeof aValue === 'number' ? aValue : new Date(aValue).getTime()
            const dateB = typeof bValue === 'number' ? bValue : new Date(bValue).getTime()
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
        }
        
        // For string fields
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }
        
        return 0
    })
}
