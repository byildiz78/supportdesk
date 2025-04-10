"use client"

import { useEffect, useState, useMemo } from "react"
import { useTicketStore } from "@/stores/ticket-store"
import { Ticket as StoreTicket } from "@/types/tickets"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TicketHeader } from "./components/ticket-header"
import { TicketContent } from "./components/ticket-content"
import { TicketSidebar } from "./components/ticket-sidebar"
import { TicketStatus } from "./components/ticket-status"
import { TicketService } from "./services/ticket-service"
import { Ticket } from "./types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCompanies } from "@/providers/companies-provider"
import { useTabStore } from "@/stores/tab-store"
import { useCategories } from "@/providers/categories-provider"
import { Category, Subcategory, Group } from "@/types/categories"

// Ticket tiplerini dönüştüren yardımcı fonksiyon
const convertToStoreTicket = (
    ticket: Ticket, 
    categories: Category[], 
    subcategories: Record<string, Subcategory[]>, 
    groups: Record<string, Group[]>
): StoreTicket => {
    // Önce store'daki mevcut bileti alalım (eğer varsa)
    const currentStoreTicket = useTicketStore.getState().selectedTicket;
    
    // Kategori, alt kategori ve grup adlarını bul
    const category = categories.find(cat => cat.id === ticket.category_id);
    const subcategoryList = ticket.category_id ? subcategories[ticket.category_id] || [] : [];
    const subcategory = subcategoryList.find(sub => sub.id === ticket.subcategory_id);
    const groupList = ticket.subcategory_id ? groups[ticket.subcategory_id] || [] : [];
    const group = groupList.find(g => g.id === ticket.group_id);
    
    return {
        ...ticket,
        // Eğer store'da mevcut bir bilet varsa ve ID'leri aynıysa, ticketno değerini koru
        // Aksi takdirde, API'den gelen değeri veya son çare olarak 0 kullan
        ticketno: (currentStoreTicket && currentStoreTicket.id === ticket.id) 
            ? currentStoreTicket.ticketno 
            : (ticket as any).ticketno || 0,
        category_name: category?.name || null,
        subcategory_name: subcategory?.name || null,
        group_name: group?.name || null,
        contact_name: ticket.customer_name || null,
        contact_first_name: null,
        contact_last_name: null,
        contact_email: ticket.customer_email || null,
        contact_phone: ticket.customer_phone || null,
        is_deleted: false, // Eksik alan
        // Firma alanlarını özellikle belirt
        companyId: ticket.company_id || null,
        companyName: ticket.company_name || null,
        // Diğer gerekli alanlar için varsayılan değerler
        assignedUserName: ticket.assigned_user_name || null,
    } as unknown as StoreTicket; // Tip dönüşümü için unknown kullanıyoruz
};

interface TicketDetailPageProps {
    ticketId: string;
    forceRefresh?: boolean;
}

// Her tab için ticket verilerini saklayacak global obje
const tabTickets: Record<string, Ticket> = {};

// Önbelleği temizlemek için kullanılacak fonksiyon
export const clearTicketCache = (tabId: string) => {
    if (tabTickets[tabId]) {
        delete tabTickets[tabId];
    }
};

export default function TicketDetailPage({ ticketId, forceRefresh = false }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket } = useTicketStore()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const { companies } = useCompanies()
    const { activeTab } = useTabStore()
    const { categories, subcategories, groups } = useCategories();
    
    // Tab için özel ticket state'i
    const [tabTicket, setTabTicket] = useState<Ticket | null>(null)
    
    // Seçilen firmanın lisans bilgilerini getir
    const selectedCompany = useMemo(() => {
        if (!tabTicket?.company_id || !Array.isArray(companies)) return null;
        return companies.find(company => company.id === tabTicket.company_id);
    }, [tabTicket, companies]);

    // Lisans bitiş tarihinin geçip geçmediğini kontrol et
    const isLicenseExpired = useMemo(() => {
        if (!selectedCompany?.flow_ba_end_date) return true;

        const endDate = new Date(selectedCompany.flow_ba_end_date);
        const now = new Date();

        return endDate < now;
    }, [selectedCompany]);

    useEffect(() => {
        const fetchTicketDetails = async () => {
            setIsLoading(true)
            setError(null)
            
            try {
                // Eğer forceRefresh true değilse ve bu tab için daha önce veri yüklendiyse, onu kullan
                if (!forceRefresh && tabTickets[activeTab]) {
                    setTabTicket(tabTickets[activeTab]);
                    setIsLoading(false);
                    return;
                }
                
                const response = await TicketService.getTicketById(ticketId);
                
                // Tab için ticket verisini kaydet
                tabTickets[activeTab] = response;
                setTabTicket(response);
                
                // Global state'i de güncelle
                setSelectedTicket(convertToStoreTicket(response, categories, subcategories, groups));
            } catch (error: any) {
                console.error('Bilet detayı alınırken hata oluştu:', error)
                setError(error.message || 'Bilet bilgileri alınamadı')
            } finally {
                setIsLoading(false)
            }
        }

        if (ticketId) {
            fetchTicketDetails()
        }
    }, [ticketId, setSelectedTicket, forceRefresh, categories, subcategories, groups])

    // Bilet güncelleme işleyicisi
    const handleTicketUpdate = (updatedTicket: Ticket) => {
        // Tab için ticket verisini güncelle
        tabTickets[activeTab] = updatedTicket;
        
        // Tab ticket state'ini güncelle
        setTabTicket(updatedTicket);
        
        // Global state'i de güncelle
        setSelectedTicket(convertToStoreTicket(updatedTicket, categories, subcategories, groups));
    }

    // Yükleme ve hata durumlarını göster
    if (isLoading || error) {
        return <TicketStatus isLoading={isLoading} error={error} />
    }

    // Bilet bulunamadıysa
    if (!tabTicket) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
                    <p className="text-gray-500">Bilet bulunamadı</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full min-h-[calc(95vh-100px)]">
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col h-full">
                <div className="flex gap-4 h-full">
                    {/* Left Content */}
                    <div className="flex-1 flex flex-col h-full">
                        {/* Main Content Area with Scroll */}
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
                                    <div className="space-y-6 pb-24 pr-4">
                                        {/* Ticket Header (now inside scroll area) */}
                                        <TicketHeader 
                                            id={tabTicket.id} 
                                            title={tabTicket.title} 
                                            createdBy={tabTicket.created_by}
                                            createdByName={tabTicket.created_by_name || "Bilinmiyor"}
                                            status={tabTicket.status}
                                            assignedTo={tabTicket.assigned_to_name || tabTicket.assigned_to}
                                            selectedCompany={selectedCompany}
                                            isLicenseExpired={isLicenseExpired}
                                            createdAt={tabTicket.created_at}
                                            resolved_by={(tabTicket.resolved_by_name || tabTicket.resolved_by || tabTicket.resolvedBy || tabTicket.resolvedByName)}
                                            resolution_notes={(tabTicket.resolution_notes || tabTicket.resolutionNotes)}
                                            description={tabTicket.description}
                                            customerName={tabTicket.customer_name}
                                            customerEmail={tabTicket.customer_email}
                                            customerPhone={tabTicket.customer_phone}
                                            companyName={tabTicket.company_name}
                                            companyId={tabTicket.company_id}
                                            contactPosition={tabTicket.contact_position}
                                            dueDate={tabTicket.due_date}
                                            parentCompanyId={tabTicket.parent_company_id}
                                            contactId={tabTicket.contact_id}
                                            slaBreached={tabTicket.sla_breach}
                                            priority={tabTicket.priority}
                                            source={tabTicket.source}
                                            categoryId={tabTicket.category_id}
                                            subcategoryId={tabTicket.subcategory_id}
                                            groupId={tabTicket.group_id}
                                            onUpdate={handleTicketUpdate}
                                            due_date={tabTicket.due_date}
                                            ticket_created_by_name={tabTicket.ticket_created_by_name}
                                            assigned_user_name={tabTicket.assigned_user_name}
                                        />
                                        
                                        {/* Stylish Divider */}
                                        <div className="my-2 relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-gray-50 dark:bg-gray-900 px-3 text-sm text-gray-500 dark:text-gray-400">
                                                    Bilet İçeriği
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Ticket Content */}
                                        <TicketContent ticket={tabTicket} />
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-[25rem]">
                        <TicketSidebar 
                            ticket={tabTicket} 
                            onTicketUpdate={handleTicketUpdate} 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}