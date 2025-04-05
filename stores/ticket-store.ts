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
    
    // Yeni eklemeler: Yorum ve ekler için bilet ID bazlı depolama
    comments: Record<string, any[]>; // Bilet ID -> Yorumlar listesi
    attachments: Record<string, any[]>; // Bilet ID -> Ekler listesi
    
    // Bildirimler için eklenen alanlar
    notifications: any[];
    
    // Getter fonksiyonu - aktif tab için ticketları döndürür
    getTickets: (tabName: string) => Ticket[];
    
    // Getter fonksiyonu - aktif tab için filtreleri döndürür
    getFilters: (tabName: string) => TicketFilter;
    
    // Yeni getter fonksiyonları
    getTicketComments: (ticketId: string) => any[];
    getTicketAttachments: (ticketId: string) => any[];
    
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
    // Yeni fonksiyon: Belirli bir bileti siler
    deleteTicket: (ticketId: string) => void;
    // Yeni fonksiyon: Çözümlendi veya kapalı olan ticketları listeden kaldır
    removeResolvedClosedTickets: (tabName: string) => void;
    
    // Bildirimler için eklenen fonksiyonlar
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (notificationId: string) => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    ticketsByTab: {},
    selectedTicket: null,
    filtersByTab: {},
    isLoading: false,
    error: null,
    loadedTabs: [],
    lastRefreshTime: {},
    
    // Yeni state'ler
    comments: {},
    attachments: {},
    notifications: [],
    
    // Getter fonksiyonu - ticketlar için
    getTickets: (tabName: string) => {
        return get().ticketsByTab[tabName] || [];
    },
    
    // Getter fonksiyonu - filtreler için
    getFilters: (tabName: string) => {
        return get().filtersByTab[tabName] || {};
    },
    
    // Yeni getter fonksiyonları
    getTicketComments: (ticketId: string) => {
        return get().comments[ticketId] || [];
    },
    
    getTicketAttachments: (ticketId: string) => {
        return get().attachments[ticketId] || [];
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
            if (ticket.sla_breach !== undefined) processedTicket.slaBreach = ticket.slaBreach;
            
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
            
            // Eğer bilet yorumları veya ekleri içeriyorsa, bunları global comments ve attachments state'lerine ekle
            let newComments = {...state.comments};
            let newAttachments = {...state.attachments};
            
            if (ticket.comments && ticket.comments.length > 0) {
                // Eğer bilet ID'si için bir yorumlar dizisi yoksa oluştur
                if (!newComments[ticket.id]) {
                    newComments[ticket.id] = [];
                }
                
                // Yeni yorumları ekle ama tekrarları önle
                newComments[ticket.id] = ticket.comments.filter(comment => {
                    // Eğer bu yorum zaten varsa ekleme
                    return !newComments[ticket.id].some(existingComment => existingComment.id === comment.id);
                }).concat(newComments[ticket.id]);
                
                // Yorumları tarihe göre sırala (yeniden eskiye)
                newComments[ticket.id].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || 0);
                    const dateB = new Date(b.created_at || b.createdAt || 0);
                    return dateA.getTime() - dateB.getTime();
                });
                
                // Yorumları bilette de güncelle
                finalTicket.comments = newComments[ticket.id];
            }
            
            if (ticket.attachments && ticket.attachments.length > 0) {
                // Eğer bilet ID'si için bir ekler dizisi yoksa oluştur
                if (!newAttachments[ticket.id]) {
                    newAttachments[ticket.id] = [];
                }
                
                // API'den gelen ekleri işleyelim ve içlerinde değişiklik yapalım
                const processedAttachments = ticket.attachments.map(attachment => {
                    const processedAttachment = { ...attachment };
                    
                    // API'den uploadedAt olarak geliyorsa uploaded_at'e dönüştürelim
                    if (processedAttachment.uploadedAt && !processedAttachment.uploaded_at) {
                        processedAttachment.uploaded_at = processedAttachment.uploadedAt;
                    } else if (processedAttachment.uploaded_at && !processedAttachment.uploadedAt) {
                        processedAttachment.uploadedAt = processedAttachment.uploaded_at;
                    }
                    
                    // API'den uploadedBy olarak geliyorsa uploaded_by'a dönüştürelim
                    if (processedAttachment.uploadedBy && !processedAttachment.uploaded_by) {
                        processedAttachment.uploaded_by = processedAttachment.uploadedBy;
                    } else if (processedAttachment.uploaded_by && !processedAttachment.uploadedBy) {
                        processedAttachment.uploadedBy = processedAttachment.uploaded_by;
                    }
                    
                    // API'den mimeType olarak geliyorsa type'a dönüştürelim
                    if (processedAttachment.mimeType && !processedAttachment.type) {
                        processedAttachment.type = processedAttachment.mimeType;
                    } else if (processedAttachment.type && !processedAttachment.mimeType) {
                        processedAttachment.mimeType = processedAttachment.type;
                    }
                    
                    // TypeScript uyarılarını önlemek için doğrudan dönüş değerinde ticketId ekle
                    return {
                        ...processedAttachment,
                        _ticketId: ticket.id // Filtreleme için özel bir özellik ekliyoruz
                    };
                });
                
                // İşlenmiş her eki eklememden önce, bu ekin zaten olup olmadığını
                // ID, URL veya diğer bilgilere göre kontrol edelim
                const updatedAttachments = [...newAttachments[ticket.id]]; // Mevcut eklerin kopyasını oluştur
                
                // Her işlenmiş ek için kontrol et
                processedAttachments.forEach(newAttachment => {
                    // Bu ek zaten var mı diye kontrol et
                    const attachmentExists = updatedAttachments.some(existingAttachment => 
                        // ID kontrolü
                        existingAttachment.id === newAttachment.id ||
                        // URL kontrolü (URL varsa)
                        (existingAttachment.url && newAttachment.url && 
                         existingAttachment.url === newAttachment.url) ||
                        // Dosya adı ve boyut kontrolü (Daha kesin kontrol)
                        (existingAttachment.name && newAttachment.name && 
                         existingAttachment.name === newAttachment.name && 
                         existingAttachment.size === newAttachment.size)
                    );
                    
                    // Eğer ek henüz yoksa, ekle
                    if (!attachmentExists) {
                        updatedAttachments.push(newAttachment);
                    }
                });
                
                // Güncellenen ekleri store'a kaydet
                newAttachments[ticket.id] = updatedAttachments;
                
                // Ekleri bilette de güncelle
                finalTicket.attachments = updatedAttachments;
            }
            
            return {
                selectedTicket: finalTicket,
                ticketsByTab: updatedTicketsByTab,
                comments: newComments,
                attachments: newAttachments
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
    
    setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
    },
    
    setError: (error: string | null) => {
        set({ error });
    },
    
    isTabLoaded: (tabName: string) => {
        return get().loadedTabs.includes(tabName);
    },
    
    // Yeni fonksiyon: Tab'ın yenilenme zamanını kontrol eder
    shouldRefreshTab: (tabName: string) => {
        const lastRefreshTime = get().lastRefreshTime[tabName] || 0;
        const currentTime = Date.now();
        return (currentTime - lastRefreshTime) > TICKET_REFRESH_INTERVAL;
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
        // İlk önce bileti işleyelim (snake_case'den camelCase'e dönüşüm)
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
        
        // Şimdi bileti store'a ekleyelim
        let isAdded = false;
        
        set((state) => {
            // İlgili tab için ticket listesini al
            const ticketsInTab = state.ticketsByTab[tabName] || [];
            
            // Bu bilet zaten var mı kontrol et
            const ticketExists = ticketsInTab.some(existingTicket => existingTicket.id === ticket.id);
            
            // Eğer bilet zaten varsa, hiçbir şey değiştirme
            if (ticketExists) {
                isAdded = false;
                return state;
            }
            
            // Yeni bileti ekleyelim
            const newTickets = [processedTicket, ...ticketsInTab];
            
            isAdded = true;
            
            return {
                ticketsByTab: {
                    ...state.ticketsByTab,
                    [tabName]: newTickets
                }
            };
        });
        
        return isAdded;
    },
    
    // Yeni fonksiyon: Ticket'a yorum ekle
    addComment: (ticketId: string, comment: any) => {
        set((state) => {
            // API'den gelen yorumu işleyelim (alan adlarını düzenleyelim)
            const processedComment = { ...comment };
            
            // API'den createdAt olarak geliyorsa created_at'e dönüştürelim
            if (processedComment.createdAt && !processedComment.created_at) {
                processedComment.created_at = processedComment.createdAt;
            }
            
            // API'den createdByName olarak geliyorsa created_by_name'e dönüştürelim
            if (processedComment.createdByName && !processedComment.created_by_name) {
                processedComment.created_by_name = processedComment.createdByName;
            } else if (processedComment.created_by_name && !processedComment.createdByName) {
                processedComment.createdByName = processedComment.created_by_name;
            }
            
            // Eğer kullanıcı adı yoksa, sistem yorumu olarak işaretle
            if (!processedComment.created_by_name && !processedComment.createdByName) {
                processedComment.created_by_name = "Sistem";
                processedComment.createdByName = "Sistem";
            }
            
            // Bilet ID'si için mevcut yorumları al veya boş bir dizi oluştur
            const currentComments = state.comments[ticketId] || [];
            
            // Yorum zaten var mı kontrol et
            const commentExists = currentComments.some(
                existingComment => existingComment.id === processedComment.id
            );
            
            // Eğer yorum zaten varsa, mevcut yorumları değiştirmeden aynen döndür
            if (commentExists) {
                return state;
            }
            
            // Yeni yorumu ekle ve tarihe göre sırala (yeniden eskiye)
            const updatedComments = [processedComment, ...currentComments].sort((a, b) => {
                const dateA = new Date(a.created_at || a.createdAt || 0);
                const dateB = new Date(b.created_at || b.createdAt || 0);
                return dateB.getTime() - dateA.getTime();
            });
            
            // Seçili ticket varsa ve ID'si eşleşiyorsa onu da güncelleyelim
            let updatedSelectedTicket = state.selectedTicket;
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                updatedSelectedTicket = {
                    ...state.selectedTicket,
                    comments: updatedComments
                };
            }
            
            // Bilet ID'sine göre yorumları güncelle
            return {
                comments: {
                    ...state.comments,
                    [ticketId]: updatedComments
                },
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    
    // Yeni fonksiyon: Ticket'a dosya ekle
    addAttachments: (ticketId: string, attachments: any[]) => {
        set((state) => {
            // API'den gelen dosyaları işleyelim (alan adlarını düzenleyelim)
            const processedAttachments = attachments.map(attachment => {
                const processedAttachment = { ...attachment };
                
                // API'den uploadedAt olarak geliyorsa uploaded_at'e dönüştürelim
                if (processedAttachment.uploadedAt && !processedAttachment.uploaded_at) {
                    processedAttachment.uploaded_at = processedAttachment.uploadedAt;
                } else if (processedAttachment.uploaded_at && !processedAttachment.uploadedAt) {
                    processedAttachment.uploadedAt = processedAttachment.uploaded_at;
                }
                
                // API'den uploadedBy olarak geliyorsa uploaded_by'a dönüştürelim
                if (processedAttachment.uploadedBy && !processedAttachment.uploaded_by) {
                    processedAttachment.uploaded_by = processedAttachment.uploadedBy;
                } else if (processedAttachment.uploaded_by && !processedAttachment.uploadedBy) {
                    processedAttachment.uploadedBy = processedAttachment.uploaded_by;
                }
                
                // API'den uploadedByName olarak geliyorsa uploaded_by_name'e dönüştürelim
                if (processedAttachment.uploadedByName && !processedAttachment.uploaded_by_name) {
                    processedAttachment.uploaded_by_name = processedAttachment.uploadedByName;
                } else if (processedAttachment.uploaded_by_name && !processedAttachment.uploadedByName) {
                    processedAttachment.uploadedByName = processedAttachment.uploaded_by_name;
                }
                
                // API'den mimeType olarak geliyorsa type'a dönüştürelim
                if (processedAttachment.mimeType && !processedAttachment.type) {
                    processedAttachment.type = processedAttachment.mimeType;
                } else if (processedAttachment.type && !processedAttachment.mimeType) {
                    processedAttachment.mimeType = processedAttachment.type;
                }
                
                // Dosya adlarını öncelikli olarak "originalFilename" kullanarak işle
                if (processedAttachment.originalFilename) {
                    // Artık name'i override etmiyoruz, sadece filename'i ayarlıyoruz
                    // processedAttachment.name = processedAttachment.originalFilename;
                    // filename alanı gerekiyorsa, bu alanı da dolduralım
                    if (!processedAttachment.filename) {
                        processedAttachment.filename = processedAttachment.originalFilename;
                    }
                } else if (processedAttachment.name) {
                    // originalFilename yoksa name'i kullan
                    processedAttachment.originalFilename = processedAttachment.name;
                    // filename alanı gerekiyorsa, bu alanı da dolduralım
                    if (!processedAttachment.filename) {
                        processedAttachment.filename = processedAttachment.name;
                    }
                } else if (processedAttachment.filename) {
                    // originalFilename ve name yoksa filename'i kullan
                    processedAttachment.name = processedAttachment.filename;
                    processedAttachment.originalFilename = processedAttachment.filename;
                }
                
                // Eğer hala bir dosya adı yoksa, "Bilinmeyen Dosya" olarak işaretle
                if (!processedAttachment.name && !processedAttachment.filename && !processedAttachment.originalFilename) {
                    const extension = processedAttachment.type 
                        ? `.${processedAttachment.type.split('/')[1] || 'bin'}`
                        : '.bin';
                    
                    const filename = `Bilinmeyen Dosya ${extension}`;
                    processedAttachment.name = filename;
                    processedAttachment.filename = filename;
                    processedAttachment.originalFilename = filename;
                }
                
                // Ticket ID ekle (bilet bazlı filtreleme için)
                processedAttachment.ticketId = ticketId;
                
                return processedAttachment;
            });
            
            // Bilet ID'si için mevcut ekleri al veya boş bir dizi oluştur
            const currentAttachments = state.attachments[ticketId] || [];
            
            // Yeni ekleri ekle, ancak daha önce eklenmiş olanları tekrar ekleme
            // ID kontrolünün yanında URL kontrolü de ekleyelim
            const updatedAttachments = [
                ...processedAttachments.filter(newAttachment => 
                    !currentAttachments.some(existing => 
                        existing.id === newAttachment.id || 
                        (existing.url && existing.url === newAttachment.url)
                    )
                ),
                ...currentAttachments
            ];
            
            // Seçili ticket varsa ve ID'si eşleşiyorsa onu da güncelleyelim
            let updatedSelectedTicket = state.selectedTicket;
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                updatedSelectedTicket = {
                    ...state.selectedTicket,
                    attachments: updatedAttachments
                };
            }
            
            // Bilet ID'sine göre ekleri güncelle
            return {
                attachments: {
                    ...state.attachments,
                    [ticketId]: updatedAttachments
                },
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    
    // Yeni fonksiyon: Belirli bir bileti günceller
    updateTicket: (updatedTicket: Ticket) => {
        // API'den gelen veriyi işleyelim (snake_case'den camelCase'e dönüşüm)
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
        
        set((state) => {
            // Önce bütün tablardaki bilet listesini güncelle
            const updatedTicketsByTab = { ...state.ticketsByTab };
            
            Object.keys(updatedTicketsByTab).forEach(tabName => {
                updatedTicketsByTab[tabName] = state.ticketsByTab[tabName].map(ticket => {
                    if (ticket.id === updatedTicket.id) {
                        // Bilet özelliklerini güncelle
                        return {
                            ...ticket,
                            ...processedTicket,
                            // ticketno ve comments değerlerini koru
                            ticketno: ticket.ticketno,
                            comments: ticket.comments
                        };
                    }
                    return ticket;
                });
            });
            
            // Şimdi selectedTicket'ı güncelle
            let updatedSelectedTicket = state.selectedTicket;
            
            if (state.selectedTicket && state.selectedTicket.id === updatedTicket.id) {
                // Eğer güncellenecek ticket şu an seçili olan ise, güncelleyelim
                updatedSelectedTicket = {
                    ...state.selectedTicket,
                    ...processedTicket,
                    // ticketno değerini koru
                    ticketno: state.selectedTicket.ticketno,
                    // comments ve attachments değerlerini koru
                    comments: state.selectedTicket.comments,
                    attachments: state.selectedTicket.attachments
                };
            }
            
            return {
                ticketsByTab: updatedTicketsByTab,
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    
    // Yeni fonksiyon: Belirli bir bileti siler
    deleteTicket: (ticketId: string) => {
        set((state) => {
            const updatedTicketsByTab: Record<string, Ticket[]> = {};
            
            // Tüm tab'ları dolaş ve ilgili biletleri temizle
            Object.keys(state.ticketsByTab).forEach(tabName => {
                const ticketsInTab = state.ticketsByTab[tabName];
                updatedTicketsByTab[tabName] = ticketsInTab.filter(ticket => ticket.id !== ticketId);
            });
            
            // selectedTicket'ı kontrol et ve ilgili bilet varsa temizle
            let updatedSelectedTicket = state.selectedTicket;
            if (state.selectedTicket && state.selectedTicket.id === ticketId) {
                updatedSelectedTicket = null;
            }
            
            return {
                ticketsByTab: updatedTicketsByTab,
                selectedTicket: updatedSelectedTicket
            };
        });
    },
    // Yeni fonksiyon: Çözümlendi veya kapalı olan ticketları listeden kaldır
    removeResolvedClosedTickets: (tabName: string) => {
        set((state) => {
            const ticketsInTab = state.ticketsByTab[tabName] || [];
            
            // 'resolved' veya 'closed' durumundaki biletleri filtrele
            const filteredTickets = ticketsInTab.filter(ticket => 
                !['resolved', 'closed'].includes(ticket.status.toLowerCase()));
            
            return {
                ticketsByTab: {
                    ...state.ticketsByTab,
                    [tabName]: filteredTickets
                }
            };
        });
    },
    
    // Bildirimler için eklenen fonksiyonlar
    async fetchNotifications() {
        try {
            // Burada gerçek API çağrısı yapılabilir
            // Şimdilik örnek bildirimler oluşturalım
            const mockNotifications = [
                { id: '1', title: 'Yeni destek talebi', message: 'Yeni bir destek talebi oluşturuldu', isRead: false, timestamp: new Date().toISOString() },
                { id: '2', title: 'Talep güncellendi', message: 'Bir destek talebi güncellendi', isRead: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: '3', title: 'Talep çözüldü', message: 'Bir destek talebi çözüldü', isRead: false, timestamp: new Date(Date.now() - 7200000).toISOString() },
            ];
            
            set({ notifications: mockNotifications });
        } catch (error) {
            console.error('Bildirimler alınırken hata oluştu:', error);
        }
    },
    
    markNotificationAsRead: (notificationId: string) => {
        set(state => ({
            notifications: state.notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, isRead: true } 
                    : notification
            )
        }));
    }
}))