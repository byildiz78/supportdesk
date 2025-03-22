import { create } from 'zustand'
import { Ticket, TicketFilter } from '@/types/tickets'

// Ticket store için özel refresh interval (90 saniye = 90000 ms)
export const TICKET_REFRESH_INTERVAL = 90000;

interface TicketStore {
    // Her tab için ayrı ticket listesi tutacağız
    ticketsByTab: Record<string, Ticket[]>;
    selectedTicket: Ticket | null;
    // Her tab için ayrı filtreler tutacağız
    filtersByTab: Record<string, TicketFilter>;
    isLoading: boolean;
    error: string | null;
    loadedTabs: string[];
    // Her tab için son yenileme zamanını tutacağız
    lastRefreshTime: Record<string, number>;
    
    // Getter fonksiyonu - aktif tab için ticketları döndürür
    getTickets: (tabName: string) => Ticket[];
    
    // Getter fonksiyonu - aktif tab için filtreleri döndürür
    getFilters: (tabName: string) => TicketFilter;
    
    // Setter fonksiyonları
    setTickets: (tickets: Ticket[], tabName: string) => void;
    clearTickets: (tabName?: string) => void;
    setSelectedTicket: (ticket: Ticket | null) => void;
    setFilters: (filters: TicketFilter, tabName: string) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    isTabLoaded: (tabName: string) => boolean;
    // Yeni fonksiyon: Tab'ın yenilenme zamanını kontrol eder
    shouldRefreshTab: (tabName: string) => boolean;
    // Yeni fonksiyon: Tab'ın son yenilenme zamanını günceller
    updateTabRefreshTime: (tabName: string) => void;
    // Yeni fonksiyon: Yeni bir talep ekle
    addTicket: (ticket: Ticket, tabName: string) => boolean;
    // Yeni fonksiyon: Ticket'a yorum ekle
    addComment: (ticketId: string, comment: any) => void;
    // Yeni fonksiyon: Ticket'a dosya ekle
    addAttachments: (ticketId: string, attachments: any[]) => void;
    // Yeni fonksiyon: Belirli bir bileti günceller
    updateTicket: (updatedTicket: Ticket) => void;
    // Yeni fonksiyon: Çözümlendi veya kapalı olan ticketları listeden kaldır
    removeResolvedClosedTickets: (tabName: string) => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    ticketsByTab: {},
    selectedTicket: null,
    filtersByTab: {},
    isLoading: false,
    error: null,
    loadedTabs: [],
    lastRefreshTime: {},
    
    // Getter fonksiyonu - ticketlar için
    getTickets: (tabName: string) => {
        return get().ticketsByTab[tabName] || [];
    },
    
    // Getter fonksiyonu - filtreler için
    getFilters: (tabName: string) => {
        return get().filtersByTab[tabName] || {};
    },
    
    // Setter fonksiyonları
    setTickets: (tickets: Ticket[], tabName: string) => {
        // API'den gelen verileri işleyerek hem snake_case hem de camelCase versiyonlarını ekleyelim
        const processedTickets = tickets.map(ticket => {
            const processedTicket = { ...ticket };
            
            // Snake_case'den camelCase'e dönüşüm
            if (ticket.customer_name) processedTicket.customerName = ticket.customer_name;
            if (ticket.customer_email) processedTicket.customerEmail = ticket.customer_email;
            if (ticket.customer_phone) processedTicket.customerPhone = ticket.customer_phone;
            if (ticket.contact_position) processedTicket.contactPosition = ticket.contact_position;
            if (ticket.company_name) processedTicket.companyName = ticket.company_name;
            if (ticket.company_id) processedTicket.companyId = ticket.company_id;
            if (ticket.contact_id) processedTicket.contactId = ticket.contact_id;
            if (ticket.contact_name) processedTicket.contactName = ticket.contact_name;
            if (ticket.category_id) processedTicket.categoryId = ticket.category_id;
            if (ticket.subcategory_id) processedTicket.subcategoryId = ticket.subcategory_id;
            if (ticket.group_id) processedTicket.groupId = ticket.group_id;
            if (ticket.assigned_to) processedTicket.assignedTo = ticket.assigned_to;
            if (ticket.created_at) processedTicket.createdAt = ticket.created_at;
            if (ticket.updated_at) processedTicket.updatedAt = ticket.updated_at;
            if (ticket.due_date) processedTicket.dueDate = ticket.due_date;
            if (ticket.sla_breach !== undefined) processedTicket.slaBreach = ticket.sla_breach;
            
            return processedTicket;
        });

        set((state) => ({
            ticketsByTab: {
                ...state.ticketsByTab,
                [tabName]: processedTickets
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
    
    setSelectedTicket: (ticket: Ticket | null) => {
        set((state) => {
            // Eğer ticket null ise, sadece selectedTicket'ı null yap
            if (!ticket) {
                return { selectedTicket: null };
            }

            // Snake_case'den camelCase'e dönüşüm
            const processedTicket = { ...ticket };
            if (ticket.customer_name) processedTicket.customerName = ticket.customer_name;
            if (ticket.customer_email) processedTicket.customerEmail = ticket.customer_email;
            if (ticket.customer_phone) processedTicket.customerPhone = ticket.customer_phone;
            if (ticket.contact_position) processedTicket.contactPosition = ticket.contact_position;
            if (ticket.company_name) processedTicket.companyName = ticket.company_name;
            if (ticket.company_id) processedTicket.companyId = ticket.company_id;
            if (ticket.contact_id) processedTicket.contactId = ticket.contact_id;
            if (ticket.contact_name) processedTicket.contactName = ticket.contact_name;
            if (ticket.category_id) processedTicket.categoryId = ticket.category_id;
            if (ticket.subcategory_id) processedTicket.subcategoryId = ticket.subcategory_id;
            if (ticket.group_id) processedTicket.groupId = ticket.group_id;
            if (ticket.assigned_to) processedTicket.assignedTo = ticket.assigned_to;
            if (ticket.created_at) processedTicket.createdAt = ticket.created_at;
            if (ticket.updated_at) processedTicket.updatedAt = ticket.updated_at;
            if (ticket.due_date) processedTicket.dueDate = ticket.due_date;
            if (ticket.sla_breach !== undefined) processedTicket.slaBreach = ticket.sla_breach;
            
            // ticketsByTab içindeki ilgili bileti de güncelle
            const updatedTicketsByTab: Record<string, Ticket[]> = {};
            
            Object.keys(state.ticketsByTab).forEach(tabName => {
                const ticketsInTab = state.ticketsByTab[tabName];
                updatedTicketsByTab[tabName] = ticketsInTab.map(existingTicket => {
                    if (existingTicket.id === ticket.id) {
                        // Mevcut bileti güncelle, ticketno değerini koru
                        return {
                            ...existingTicket,
                            ...processedTicket,
                            // ticketno değerini koru
                            ticketno: existingTicket.ticketno
                        };
                    }
                    return existingTicket;
                });
            });
            
            // Eğer mevcut seçili bilet varsa ve ID'si yeni gelen biletle aynıysa
            // ticketno değerini koru
            const finalTicket = state.selectedTicket && state.selectedTicket.id === ticket.id
                ? { 
                    ...processedTicket,
                    ticketno: state.selectedTicket.ticketno
                } : 
                processedTicket;
            
            return {
                selectedTicket: finalTicket,
                ticketsByTab: updatedTicketsByTab
            };
        });
    },
    
    setFilters: (filters: TicketFilter, tabName: string) => {
        set((state) => ({
            filtersByTab: {
                ...state.filtersByTab,
                [tabName]: filters
            }
        }));
    },
    
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
    
    // Yeni fonksiyon: Yeni bir talep ekle
    addTicket: (ticket: Ticket, tabName: string) => {
        // Önce aynı başlık ve şirket ID'sine sahip bir talep var mı kontrol et
        const existingTickets = get().ticketsByTab[tabName] || [];
        const isDuplicate = existingTickets.some(existingTicket => 
            existingTicket.title === ticket.title && 
            existingTicket.company_id === ticket.company_id
        );
        
        // Eğer aynı talep zaten varsa, ekleme yapma ve false döndür
        if (isDuplicate) {
            return false;
        }
        
        set((state) => {
            // API'den gelen ticketno değerini kullan
            const ticketToAdd = { ...ticket };
            
            // Snake_case'den camelCase'e dönüşüm
            if (ticket.customer_name) ticketToAdd.customerName = ticket.customer_name;
            if (ticket.customer_email) ticketToAdd.customerEmail = ticket.customer_email;
            if (ticket.customer_phone) ticketToAdd.customerPhone = ticket.customer_phone;
            if (ticket.contact_position) ticketToAdd.contactPosition = ticket.contact_position;
            if (ticket.company_name) ticketToAdd.companyName = ticket.company_name;
            if (ticket.company_id) ticketToAdd.companyId = ticket.company_id;
            if (ticket.contact_id) ticketToAdd.contactId = ticket.contact_id;
            if (ticket.contact_name) ticketToAdd.contactName = ticket.contact_name;
            if (ticket.category_id) ticketToAdd.categoryId = ticket.category_id;
            if (ticket.subcategory_id) ticketToAdd.subcategoryId = ticket.subcategory_id;
            if (ticket.group_id) ticketToAdd.groupId = ticket.group_id;
            if (ticket.assigned_to) ticketToAdd.assignedTo = ticket.assigned_to;
            if (ticket.created_at) ticketToAdd.createdAt = ticket.created_at;
            if (ticket.updated_at) ticketToAdd.updatedAt = ticket.updated_at;
            if (ticket.due_date) ticketToAdd.dueDate = ticket.due_date;
            if (ticket.sla_breach !== undefined) ticketToAdd.slaBreach = ticket.sla_breach;
            
            return {
                ticketsByTab: {
                    ...state.ticketsByTab,
                    [tabName]: [...(state.ticketsByTab[tabName] || []), ticketToAdd]
                },
                loadedTabs: state.loadedTabs.includes(tabName) 
                    ? state.loadedTabs 
                    : [...state.loadedTabs, tabName],
                lastRefreshTime: {
                    ...state.lastRefreshTime,
                    [tabName]: Date.now() // Verileri güncellerken son yenileme zamanını da güncelle
                }
            };
        });
        
        // Başarıyla eklendi, true döndür
        return true;
    },
    
    // Yeni fonksiyon: Ticket'a yorum ekle
    addComment: (ticketId: string, comment: any) => {
        set((state) => {
            // Önce tüm tablardaki ticketları kontrol edelim
            const updatedTicketsByTab: Record<string, Ticket[]> = {};
            
            Object.keys(state.ticketsByTab).forEach(tabName => {
                const ticketsInTab = state.ticketsByTab[tabName];
                updatedTicketsByTab[tabName] = ticketsInTab.map(ticket => {
                    if (ticket.id === ticketId) {
                        // Yorum ekleyelim
                        return {
                            ...ticket,
                            comments: [...(ticket.comments || []), comment]
                        };
                    }
                    return ticket;
                });
            });
            
            // Seçili ticket varsa ve ID'si eşleşiyorsa onu da güncelleyelim
            let updatedSelectedTicket = state.selectedTicket;
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                updatedSelectedTicket = {
                    ...state.selectedTicket,
                    comments: [...(state.selectedTicket.comments || []), comment]
                };
            }
            
            return {
                ticketsByTab: updatedTicketsByTab,
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    
    // Yeni fonksiyon: Ticket'a dosya ekle
    addAttachments: (ticketId: string, attachments: any[]) => {
        set((state) => {
            // Önce tüm tablardaki ticketları kontrol edelim
            const updatedTicketsByTab: Record<string, Ticket[]> = {};
            
            Object.keys(state.ticketsByTab).forEach(tabName => {
                const ticketsInTab = state.ticketsByTab[tabName];
                updatedTicketsByTab[tabName] = ticketsInTab.map(ticket => {
                    if (ticket.id === ticketId) {
                        // Eklentileri ekleyelim
                        return {
                            ...ticket,
                            attachments: [...(ticket.attachments || []), ...attachments]
                        };
                    }
                    return ticket;
                });
            });
            
            // Seçili ticket varsa ve ID'si eşleşiyorsa onu da güncelleyelim
            let updatedSelectedTicket = state.selectedTicket;
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                updatedSelectedTicket = {
                    ...state.selectedTicket,
                    attachments: [...(state.selectedTicket.attachments || []), ...attachments]
                };
            }
            
            return {
                ticketsByTab: updatedTicketsByTab,
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    
    // Yeni fonksiyon: Belirli bir bileti günceller
    updateTicket: (updatedTicket: Ticket) => {
        set((state) => {
            // Snake_case'den camelCase'e dönüşüm
            const processedTicket = { ...updatedTicket };
            if (updatedTicket.customer_name) processedTicket.customerName = updatedTicket.customer_name;
            if (updatedTicket.customer_email) processedTicket.customerEmail = updatedTicket.customer_email;
            if (updatedTicket.customer_phone) processedTicket.customerPhone = updatedTicket.customer_phone;
            if (updatedTicket.contact_position) processedTicket.contactPosition = updatedTicket.contact_position;
            if (updatedTicket.company_name) processedTicket.companyName = updatedTicket.company_name;
            if (updatedTicket.company_id) processedTicket.companyId = updatedTicket.company_id;
            if (updatedTicket.contact_id) processedTicket.contactId = updatedTicket.contact_id;
            if (updatedTicket.contact_name) processedTicket.contactName = updatedTicket.contact_name;
            if (updatedTicket.category_id) processedTicket.categoryId = updatedTicket.category_id;
            if (updatedTicket.subcategory_id) processedTicket.subcategoryId = updatedTicket.subcategory_id;
            if (updatedTicket.group_id) processedTicket.groupId = updatedTicket.group_id;
            if (updatedTicket.assigned_to) processedTicket.assignedTo = updatedTicket.assigned_to;
            if (updatedTicket.created_at) processedTicket.createdAt = updatedTicket.created_at;
            if (updatedTicket.updated_at) processedTicket.updatedAt = updatedTicket.updated_at;
            if (updatedTicket.due_date) processedTicket.dueDate = updatedTicket.due_date;
            if (updatedTicket.sla_breach !== undefined) processedTicket.slaBreach = updatedTicket.sla_breach;
            // callcount alanını da işle
            if (updatedTicket.callcount !== undefined) processedTicket.callcount = updatedTicket.callcount;
            
            // Önce selectedTicket'ı güncelle
            const newSelectedTicket = state.selectedTicket ? 
                { 
                    ...state.selectedTicket,
                    ...processedTicket,
                    // ticketno değerini koru
                    ticketno: state.selectedTicket.ticketno
                } : 
                processedTicket;
            
            // Sonra ticketsByTab içindeki ilgili bileti güncelle
            const updatedTicketsByTab: Record<string, Ticket[]> = {};
            
            Object.keys(state.ticketsByTab).forEach(tabName => {
                const ticketsInTab = state.ticketsByTab[tabName];
                updatedTicketsByTab[tabName] = ticketsInTab.map(existingTicket => {
                    if (existingTicket.id === updatedTicket.id) {
                        // Mevcut bileti güncelle, ticketno değerini koru
                        return {
                            ...existingTicket,
                            ...processedTicket,
                            // ticketno değerini koru
                            ticketno: existingTicket.ticketno
                        };
                    }
                    return existingTicket;
                });
            });
            
            return {
                selectedTicket: newSelectedTicket,
                ticketsByTab: updatedTicketsByTab
            };
        });
    },
    
    // Yeni fonksiyon: Çözümlendi veya kapalı olan ticketları listeden kaldır
    removeResolvedClosedTickets: (tabName: string) => {
        set((state) => {
            if (!state.ticketsByTab[tabName]) return state;
            
            const updatedTickets = state.ticketsByTab[tabName].filter(ticket => 
                ticket.status !== "resolved" && ticket.status !== "closed"
            );
            
            return {
                ticketsByTab: {
                    ...state.ticketsByTab,
                    [tabName]: updatedTickets
                }
            };
        });
    }
}))