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

// Ticket tiplerini dönüştüren yardımcı fonksiyon
const convertToStoreTicket = (ticket: Ticket): StoreTicket => {
    // Önce store'daki mevcut bileti alalım (eğer varsa)
    const currentStoreTicket = useTicketStore.getState().selectedTicket;
    
    return {
        ...ticket,
        // Eğer store'da mevcut bir bilet varsa ve ID'leri aynıysa, ticketno değerini koru
        // Aksi takdirde, API'den gelen değeri veya son çare olarak 0 kullan
        ticketno: (currentStoreTicket && currentStoreTicket.id === ticket.id) 
            ? currentStoreTicket.ticketno 
            : (ticket as any).ticketno || 0,
        category_name: ticket.category_id || null,
        subcategory_name: ticket.subcategory_id || null,
        group_name: ticket.group_id || null,
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
}

// Her tab için ticket verilerini saklayacak global obje
const tabTickets: Record<string, Ticket> = {};

// Önbelleği temizlemek için kullanılacak fonksiyon
export const clearTicketCache = (tabId: string) => {
    if (tabTickets[tabId]) {
        delete tabTickets[tabId];
    }
};

export default function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket } = useTicketStore()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const { companies } = useCompanies()
    const { activeTab } = useTabStore()
    
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
                // Eğer bu tab için daha önce veri yüklendiyse, onu kullan
                if (tabTickets[activeTab]) {
                    setTabTicket(tabTickets[activeTab]);
                    setIsLoading(false);
                    return;
                }
                
                const response = await TicketService.getTicketById(ticketId);
                
                // Tab için ticket verisini kaydet
                tabTickets[activeTab] = response;
                setTabTicket(response);
                
                // Global state'i de güncelle
                setSelectedTicket(convertToStoreTicket(response));
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
    }, [ticketId, setSelectedTicket])

    // Bilet güncelleme işleyicisi
    const handleTicketUpdate = (updatedTicket: Ticket) => {
        // Tab için ticket verisini güncelle
        tabTickets[activeTab] = updatedTicket;
        
        // Tab ticket state'ini güncelle
        setTabTicket(updatedTicket);
        
        // Global state'i de güncelle
        setSelectedTicket(convertToStoreTicket(updatedTicket));
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
                        {/* Ticket Header */}
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
                        />
                        
                        {/* Main Content Area */}
                        <div className="flex-1 mt-4 overflow-hidden">
                            {/* Content */}
                            <div className="h-full flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1 h-[calc(100vh-250px)]">
                                    <div className="space-y-6 pb-24 pr-4">
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
