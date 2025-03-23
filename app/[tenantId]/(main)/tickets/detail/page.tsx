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

export default function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket } = useTicketStore()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const { companies } = useCompanies()
    
    // Seçilen firmanın lisans bilgilerini getir
    const selectedCompany = useMemo(() => {
        if (!selectedTicket?.company_id || !Array.isArray(companies)) return null;
        return companies.find(company => company.id === selectedTicket.company_id);
    }, [selectedTicket, companies]);

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
                const response = await TicketService.getTicketById(ticketId);
                setSelectedTicket(response);
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
        // Hem selectedTicket'ı hem de store'daki bileti güncelle
        setSelectedTicket(convertToStoreTicket(updatedTicket))
        
        // Store'daki updateTicket fonksiyonunu da çağır (varsa)
        if (useTicketStore.getState().updateTicket) {
            useTicketStore.getState().updateTicket(convertToStoreTicket(updatedTicket))
        }
        
        toast({
            title: "Başarılı",
            description: "Bilet başarıyla güncellendi",
            variant: "default",
        })
    }

    // Yükleme ve hata durumlarını göster
    if (isLoading || error) {
        return <TicketStatus isLoading={isLoading} error={error} />
    }

    // Bilet bulunamadıysa
    if (!selectedTicket) {
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
                            id={selectedTicket.id} 
                            title={selectedTicket.title} 
                            createdBy={selectedTicket.created_by}
                            createdByName={selectedTicket.created_by_name || "Bilinmiyor"}
                            status={selectedTicket.status}
                            assignedTo={selectedTicket.assigned_to_name || selectedTicket.assigned_to}
                            selectedCompany={selectedCompany}
                            isLicenseExpired={isLicenseExpired}
                            createdAt={selectedTicket.created_at}
                        />
                        
                        {/* Main Content Area */}
                        <div className="flex-1 mt-4 overflow-hidden">
                            {/* Content */}
                            <div className="h-full flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1 h-[calc(100vh-250px)]">
                                    <div className="space-y-6 pb-24 pr-4">
                                        <TicketContent ticket={selectedTicket} />
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-[25rem]">
                        <TicketSidebar 
                            ticket={selectedTicket} 
                            onTicketUpdate={handleTicketUpdate} 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
