"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTicketStore } from "@/stores/ticket-store"
import { User, Mail, Phone, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { CommentTimeline } from "@/components/tickets/comment-timeline"
import { CommentForm } from "@/components/tickets/comment-form"
import { mockTickets } from "../data/mock-data"

interface TicketDetailPageProps {
    ticketId: string;
}

export default function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket, addComment } = useTicketStore()
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        // Find ticket from mock data
        const ticket = mockTickets.find(t => t.id === ticketId)
        if (ticket) {
            setSelectedTicket(ticket)
        }
    }, [ticketId, setSelectedTicket])

    const handleCommentSubmit = async (content: string, isInternal: boolean, attachments?: string[]) => {
        if (!selectedTicket) return

        setIsSubmitting(true)
        try {
            const newComment = {
                ticketId: selectedTicket.id,
                content,
                createdBy: "current_user_id",
                createdByName: "Destek Ekibi",
                createdAt: new Date().toISOString(),
                isInternal,
                attachments
            }
            
            addComment(selectedTicket.id, newComment)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!selectedTicket) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 p-4 pr-2">
                {/* Ticket Header */}
                <Card className="p-6 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {selectedTicket.title}
                            </h1>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                <User className="h-4 w-4" />
                                {selectedTicket.createdBy} tarafından oluşturuldu
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                #{selectedTicket.id}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Comments Section */}
                <Card className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-24rem)]">
                        <div className="p-6 space-y-6">
                            {/* Original Description */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {selectedTicket.customerName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(selectedTicket.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300">
                                        {selectedTicket.description}
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                                <CommentTimeline comments={selectedTicket.comments} />
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Comment Input */}
                <Card className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                    <CommentForm onSubmit={handleCommentSubmit} />
                </Card>
            </div>

            {/* Sidebar */}
            <div className="w-80 p-4 pl-2">
                <Card className="h-full p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                    <div>
                        <h3 className="font-semibold mb-4">Durum</h3>
                        <Select defaultValue={selectedTicket.status}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Açık</SelectItem>
                                <SelectItem value="in_progress">İşlemde</SelectItem>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="resolved">Çözüldü</SelectItem>
                                <SelectItem value="closed">Kapalı</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Öncelik</h3>
                        <Select defaultValue={selectedTicket.priority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Düşük</SelectItem>
                                <SelectItem value="medium">Orta</SelectItem>
                                <SelectItem value="high">Yüksek</SelectItem>
                                <SelectItem value="urgent">Acil</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Atanan Kişi</h3>
                        <Select defaultValue={selectedTicket.assignedTo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Atanmadı" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="agent1">Ahmet Yılmaz</SelectItem>
                                <SelectItem value="agent2">Ayşe Kaya</SelectItem>
                                <SelectItem value="agent3">Can Demir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold">Müşteri Bilgileri</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{selectedTicket.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{selectedTicket.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{selectedTicket.customerPhone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold">Etiketler</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedTicket.tags?.map((tag, index) => (
                                <Badge key={index} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                            {(!selectedTicket.tags || selectedTicket.tags.length === 0) && (
                                <span className="text-sm text-gray-500">Etiket eklenmemiş</span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}