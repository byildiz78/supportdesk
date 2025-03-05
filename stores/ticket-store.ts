import { create } from 'zustand';
import { Ticket, TicketFilter } from '@/types/tickets';

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
        tickets: state.tickets.map((t) => t.id === ticket.id ? ticket : t)
    })),
    setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
    setFilters: (filters) => set({ filters }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error })
}));