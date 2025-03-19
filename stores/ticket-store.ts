import { create } from 'zustand'
import { Ticket, TicketFilter } from '@/types/tickets'

// Ticket store için özel refresh interval (90 saniye = 90000 ms)
export const TICKET_REFRESH_INTERVAL = 90000;

interface TicketStore {
    // Her tab için ayrı ticket listesi tutacağız
    ticketsByTab: Record<string, Ticket[]>;
    selectedTicket: Ticket | null;
    filters: TicketFilter;
    isLoading: boolean;
    error: string | null;
    loadedTabs: string[];
    // Her tab için son yenileme zamanını tutacağız
    lastRefreshTime: Record<string, number>;
    
    // Getter fonksiyonu - aktif tab için ticketları döndürür
    getTickets: (tabName: string) => Ticket[];
    
    // Setter fonksiyonları
    setTickets: (tickets: Ticket[], tabName: string) => void;
    clearTickets: (tabName?: string) => void;
    setSelectedTicket: (ticket: Ticket | null) => void;
    setFilters: (filters: TicketFilter) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    isTabLoaded: (tabName: string) => boolean;
    // Yeni fonksiyon: Tab'ın yenilenme zamanını kontrol eder
    shouldRefreshTab: (tabName: string) => boolean;
    // Yeni fonksiyon: Tab'ın son yenilenme zamanını günceller
    updateTabRefreshTime: (tabName: string) => void;
    // Yorum ve eklenti fonksiyonları
    addComment: (ticketId: string, comment: any) => void;
    addAttachments: (ticketId: string, attachments: any[]) => void;
    updateTicket: (updatedTicket: Ticket) => void;
    addTicket: (ticket: Ticket, tabName: string) => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    ticketsByTab: {},
    selectedTicket: null,
    filters: {},
    isLoading: false,
    error: null,
    loadedTabs: [],
    lastRefreshTime: {},
    
    // Getter fonksiyonu
    getTickets: (tabName: string) => {
        return get().ticketsByTab[tabName] || [];
    },
    
    // Setter fonksiyonları
    setTickets: (tickets: Ticket[], tabName: string) => {
        set((state) => ({
            ticketsByTab: {
                ...state.ticketsByTab,
                [tabName]: tickets
            },
            loadedTabs: state.loadedTabs.includes(tabName) 
                ? state.loadedTabs 
                : [...state.loadedTabs, tabName],
            lastRefreshTime: {
                ...state.lastRefreshTime,
                [tabName]: Date.now() // Verileri güncellerken son yenileme zamanını da güncelle
            }
        }));
    },
    
    clearTickets: (tabName?: string) => {
        if (tabName) {
            // Belirli bir tab için temizleme
            set((state) => {
                const newTicketsByTab = { ...state.ticketsByTab };
                delete newTicketsByTab[tabName];
                
                const newLoadedTabs = state.loadedTabs.filter(tab => tab !== tabName);
                
                const newLastRefreshTime = { ...state.lastRefreshTime };
                delete newLastRefreshTime[tabName];
                
                return {
                    ticketsByTab: newTicketsByTab,
                    loadedTabs: newLoadedTabs,
                    lastRefreshTime: newLastRefreshTime
                };
            });
        } else {
            // Tüm tablar için temizleme
            set({ ticketsByTab: {}, loadedTabs: [], lastRefreshTime: {} });
        }
    },
    
    setSelectedTicket: (ticket: Ticket | null) => set({ selectedTicket: ticket }),
    setFilters: (filters: TicketFilter) => set({ filters }),
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    isTabLoaded: (tabName: string) => {
        return get().loadedTabs.includes(tabName);
    },
    
    // Yeni fonksiyon: Tab'ın yenilenme zamanını kontrol eder
    shouldRefreshTab: (tabName: string) => {
        const lastRefresh = get().lastRefreshTime[tabName] || 0;
        const currentTime = Date.now();
        // TICKET_REFRESH_INTERVAL (90 saniye) geçtiyse true, geçmediyse false döndür
        return currentTime - lastRefresh > TICKET_REFRESH_INTERVAL;
    },
    
    // Yeni fonksiyon: Tab'ın son yenilenme zamanını günceller
    updateTabRefreshTime: (tabName: string) => {
        set((state) => ({
            lastRefreshTime: {
                ...state.lastRefreshTime,
                [tabName]: Date.now()
            }
        }));
    },
    
    // Yorum ekleme fonksiyonu
    addComment: (ticketId: string, comment: any) => {
        set((state) => {
            // Eğer seçili bilet varsa ve ID'si eşleşiyorsa, yorumu ekle
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                const updatedTicket = {
                    ...state.selectedTicket,
                    comments: [
                        ...(state.selectedTicket.comments || []),
                        comment
                    ]
                };
                
                return {
                    selectedTicket: updatedTicket
                };
            }
            
            return state;
        });
    },
    
    // Eklenti ekleme fonksiyonu
    addAttachments: (ticketId: string, attachments: any[]) => {
        set((state) => {
            // Eğer seçili bilet varsa ve ID'si eşleşiyorsa, eklentileri ekle
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                const updatedTicket = {
                    ...state.selectedTicket,
                    attachments: [
                        ...(state.selectedTicket.attachments || []),
                        ...attachments
                    ]
                };
                
                return {
                    selectedTicket: updatedTicket
                };
            }
            
            return state;
        });
    },
    
    // Bilet güncelleme fonksiyonu
    updateTicket: (updatedTicket: Ticket) => {
        set((state) => {
            if (state.selectedTicket && state.selectedTicket.id === updatedTicket.id) {
                return { selectedTicket: updatedTicket };
            }
            return state;
        });
    },
    
    // Yeni bilet ekleme fonksiyonu
    addTicket: (ticket: Ticket, tabName: string) => {
        set((state) => {
            // Eğer bu tab için henüz bir liste yoksa, boş bir liste oluştur
            const currentTickets = state.ticketsByTab[tabName] || [];
            
            // Yeni bileti listenin başına ekle
            return {
                ticketsByTab: {
                    ...state.ticketsByTab,
                    [tabName]: [ticket, ...currentTickets]
                }
            };
        });
    }
}))