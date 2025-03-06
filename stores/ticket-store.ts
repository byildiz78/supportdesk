import { create } from 'zustand';
import { Ticket, TicketComment, TicketFilter } from '@/types/tickets';

interface TicketStore {
    tickets: Ticket[];
    selectedTicket: Ticket | null;
    filters: TicketFilter;
    isLoading: boolean;
    error: string | null;
    setTickets: (tickets: Ticket[]) => void;
    addTicket: (ticket: Ticket) => void;
    updateTicket: (ticket: Ticket) => void;
    setSelectedTicket: (ticket: Ticket | null) => void;
    setFilters: (filters: TicketFilter) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    addComment: (ticketId: string, comment: Omit<TicketComment, 'id'>) => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
    tickets: [],
    selectedTicket: null,
    filters: {},
    isLoading: false,
    error: null,
    setTickets: (tickets) => set({ tickets }),
    addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
    updateTicket: (ticket) => set((state) => ({
        tickets: state.tickets.map((t) => t.id === ticket.id ? ticket : t),
        selectedTicket: state.selectedTicket?.id === ticket.id ? ticket : state.selectedTicket
    })),
    setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
    setFilters: (filters) => set({ filters }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    addComment: (ticketId, comment) => set((state) => {
        const newComment = {
            ...comment,
            id: Date.now().toString() // Geçici ID oluştur
        };

        const updatedTickets = state.tickets.map(ticket => {
            if (ticket.id === ticketId) {
                return {
                    ...ticket,
                    comments: [...(ticket.comments || []), newComment]
                };
            }
            return ticket;
        });

        const updatedSelectedTicket = state.selectedTicket?.id === ticketId
            ? {
                ...state.selectedTicket,
                comments: [...(state.selectedTicket.comments || []), newComment]
            }
            : state.selectedTicket;

        return {
            tickets: updatedTickets,
            selectedTicket: updatedSelectedTicket
        };
    })
}));