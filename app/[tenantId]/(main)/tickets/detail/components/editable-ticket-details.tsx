"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { User, Edit, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TicketService } from "../services/ticket-service"
import { processHtmlContent, normalizeNewlines } from "@/utils/text-utils"

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
        <Card className="p-6 mb-6">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {ticket.customer_name}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">
                                {new Date(ticket.created_at).toLocaleString()}
                            </div>
                            {!isEditing ? (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleEdit}
                                    className="h-8 w-8 p-0"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Düzenle</span>
                                </Button>
                            ) : (
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleCancel}
                                        className="h-8 w-8 p-0"
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">İptal</span>
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleSave}
                                        className="h-8 w-8 p-0"
                                        disabled={isSubmitting}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">Kaydet</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Bilet başlığı"
                                    className="font-medium text-lg"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Bilet açıklaması"
                                    rows={10}
                                    className="resize-none min-h-[200px]"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="font-medium text-lg">{title}</div>
                            <div className="text-gray-700 dark:text-gray-300 ticket-description">
                                {processHtmlContent(ticket.description)}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    )
}
