"use client"

import { useEffect, useState } from "react"
import { useTicketStore } from "@/stores/ticket-store"
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

interface TicketDetailPageProps {
    ticketId: string;
}

export default function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket } = useTicketStore()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        const fetchTicketDetails = async () => {
            setIsLoading(true)
            setError(null)

            console.log('fetchTicketDetails çağrıldı, ticketId:', ticketId);

            try {
                const response = await TicketService.getTicketById(ticketId);
                console.log('Bilet detayı alındı:', response);
                console.log('Bilet yorumları:', response.comments);
                setSelectedTicket(response);
                console.log('selectedTicket güncellendi:', response);
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
        setSelectedTicket(updatedTicket)
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
            <div className="flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
                    <p className="text-gray-500">Bilet bulunamadı</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 h-[calc(70vh-200px)] overflow-y-auto">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col h-full">
                    {/* Ticket Header */}
                    <TicketHeader
                        id={selectedTicket.id}
                        title={selectedTicket.title}
                        createdBy={selectedTicket.created_by}
                    />

                    {/* Main Content Area */}
                    <div className="flex flex-1 gap-4 px-4 overflow-hidden">
                        {/* Content */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="space-y-6 pb-24 pr-4">
                                <TicketContent ticket={selectedTicket} />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="w-80 h-full">
                            <TicketSidebar
                                ticket={selectedTicket}
                                onTicketUpdate={handleTicketUpdate}
                            />
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
