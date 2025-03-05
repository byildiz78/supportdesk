"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTicketStore } from "@/stores/ticket-store"
import { MessageSquare, Send, Paperclip, Clock, User, Mail, Phone, Tag, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketDetailPageProps {
    ticketId: string;
}

export default function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
    const { selectedTicket, setSelectedTicket } = useTicketStore()
    const [newComment, setNewComment] = useState("")
    const [isInternal, setIsInternal] = useState(false)

    useEffect(() => {
        // Fetch ticket details
        // This will be replaced with actual API call
        const mockTicket = {
            id: ticketId,
            title: "Örnek Destek Talebi",
            description: "Bu bir örnek destek talebidir.",
            status: "open",
            priority: "medium",
            source: "email",
            category: "technical",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            customerPhone: "+90 555 123 4567",
            createdAt: new Date().toISOString(),
            comments: [
                {
                    id: "1",
                    content: "Merhaba, talebinizi aldık. En kısa sürede dönüş yapacağız.",
                    createdBy: "Destek Ekibi",
                    createdAt: new Date().toISOString(),
                    isInternal: false
                }
            ]
        }
        setSelectedTicket(mockTicket)
    }, [ticketId])

    if (!selectedTicket) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex-1 flex gap-4 overflow-hidden p-4">
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Ticket Header */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {selectedTicket.title}
                                </h1>
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="h-4 w-4" />
                                    {new Date(selectedTicket.createdAt).toLocaleString()}
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
                        <ScrollArea className="h-full">
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
                                {selectedTicket.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center",
                                                comment.isInternal
                                                    ? "bg-amber-100 dark:bg-amber-900/50"
                                                    : "bg-green-100 dark:bg-green-900/50"
                                            )}>
                                                <User className={cn(
                                                    "h-5 w-5",
                                                    comment.isInternal
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-green-600 dark:text-green-400"
                                                )} />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {comment.createdBy}
                                                    {comment.isInternal && (
                                                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                                            İç Not
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300">
                                                {comment.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Comment Input */}
                    <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                        <div className="space-y-4">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Yanıtınızı yazın..."
                                className="min-h-[100px]"
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Select
                                        value={isInternal ? "internal" : "public"}
                                        onValueChange={(value) => setIsInternal(value === "internal")}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Genel Yanıt</SelectItem>
                                            <SelectItem value="internal">İç Not</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="h-4 w-4 mr-2" />
                                    Gönder
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <Card className="w-80 p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
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
                                <SelectItem value="agent1">Destek Uzmanı 1</SelectItem>
                                <SelectItem value="agent2">Destek Uzmanı 2</SelectItem>
                                <SelectItem value="agent3">Destek Uzmanı 3</SelectItem>
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