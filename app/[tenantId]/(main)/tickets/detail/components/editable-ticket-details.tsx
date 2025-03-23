"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { User, Edit, Check, X, MessageSquare, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TicketService } from "../services/ticket-service"
import { processHtmlContent, normalizeNewlines } from "@/utils/text-utils"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface EditableTicketDetailsProps {
    ticket: {
        id: string;
        title: string;
        description: string;
        customer_name: string | null;
        created_at: string;
        status?: string;
        priority?: string;
        source?: string | null;
        category_id?: string | null;
        subcategory_id?: string | null;
        group_id?: string | null;
        assigned_to?: string | null;
        customer_email?: string | null;
        customer_phone?: string | null;
        company_name?: string | null;
        company_id?: string | null;
        contact_position?: string | null;
        due_date?: string | null;
        parent_company_id?: string | null;
        contact_id?: string | null;
        sla_breach?: boolean | null;
    };
    onUpdate: (updatedTicket: any) => void;
}

export function EditableTicketDetails({ ticket, onUpdate }: EditableTicketDetailsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(ticket.title)
    const [description, setDescription] = useState(ticket.description)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    // Process the description when entering edit mode to ensure consistent display
    const handleEdit = () => {
        // Make sure we're using the raw description from the ticket
        setDescription(ticket.description)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setTitle(ticket.title)
        setDescription(ticket.description)
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast({
                title: "Hata",
                description: "Bilet başlığı boş olamaz",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            const updatedTicket = await TicketService.updateTicket({
                id: ticket.id,
                title,
                description,
                status: ticket.status || 'open',
                priority: ticket.priority || 'medium',
                source: ticket.source || 'web',
                category_id: ticket.category_id,
                subcategory_id: ticket.subcategory_id,
                group_id: ticket.group_id,
                assigned_to: ticket.assigned_to,
                customer_name: ticket.customer_name,
                customer_email: ticket.customer_email,
                customer_phone: ticket.customer_phone,
                company_name: ticket.company_name,
                company_id: ticket.company_id,
                contact_position: ticket.contact_position,
                due_date: ticket.due_date,
                parent_company_id: ticket.parent_company_id,
                contact_id: ticket.contact_id,
                sla_breach: ticket.sla_breach || false,
                updated_by: 'current-user',
                isUpdate: true
            })

            toast({
                title: "Başarılı",
                description: "Bilet başarıyla güncellendi",
            })

            onUpdate(updatedTicket)
            setIsEditing(false)
        } catch (error: any) {
            toast({
                title: "Hata",
                description: error.message || "Bilet güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="overflow-hidden border-0 shadow-lg rounded-2xl mb-6 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-800/70">
            {/* Üst Renkli Şerit */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            
            <div className="p-6">
                <div className="flex gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <User className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                                    {ticket.customer_name || "İsimsiz Müşteri"}
                                </div>
                                <Badge 
                                    variant="outline" 
                                    className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-2 py-0.5 text-xs rounded-full"
                                >
                                    {ticket.company_name || "Bireysel"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{format(new Date(ticket.created_at), "dd.MM.yyyy")}</span>
                                    <Clock className="h-3.5 w-3.5 ml-1 text-gray-400" />
                                    <span>{format(new Date(ticket.created_at), "HH:mm")}</span>
                                </div>
                                {!isEditing ? (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleEdit}
                                        className="h-8 px-3 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                                        <span>Düzenle</span>
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={handleCancel}
                                            className="h-8 px-3 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <X className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                                            <span>İptal</span>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={handleSave}
                                            className="h-8 px-3 rounded-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-800/30 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <Check className="h-3.5 w-3.5 mr-1.5" />
                                            <span>Kaydet</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {isEditing ? (
                            <div className="space-y-4 mt-2">
                                <div className="relative">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Bilet başlığı"
                                        className="font-medium text-lg border-2 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 rounded-xl pl-4 pr-4 py-2 shadow-sm"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="relative">
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Bilet açıklaması"
                                        rows={10}
                                        className="resize-none min-h-[200px] border-2 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 rounded-xl p-4 shadow-sm"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800/40 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700/50 mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200">{title}</h3>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 ticket-description prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-p:text-gray-600 dark:prose-p:text-gray-300">
                                    {processHtmlContent(ticket.description)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
