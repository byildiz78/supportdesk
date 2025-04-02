"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { User, Edit, Check, X, MessageSquare, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { processHtmlContent, normalizeNewlines } from "@/utils/text-utils"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import axios from "@/lib/axios"
import { getUserId } from "@/utils/user-utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(true)
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
            const userId = getUserId();
            const response = await axios.post('/api/main/tickets/updateTicketHeader', {
                title,
                description,
                updated_by: userId,
                id: ticket.id
            });

            if (response.data.success) {
                toast({
                    title: "Başarılı",
                    description: "Bilet başarıyla güncellendi",
                });
                
                // API'den dönen veriyi kullan
                onUpdate(response.data.data);
                setIsEditing(false);
            } else {
                throw new Error(response.data.message || "Bilet güncellenirken bir hata oluştu");
            }
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
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Üst Renkli Şerit */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>

            <div className="p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <User className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-base">
                                    {ticket.customer_name || "İsimsiz Müşteri"}
                                </div>
                                <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 px-1.5 py-0.5 text-xs rounded-full"
                                >
                                    {ticket.company_name || "Bireysel"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span>{format(new Date(ticket.created_at), "dd.MM.yyyy")}</span>
                                    <Clock className="h-3 w-3 ml-1 text-gray-400" />
                                    <span>{format(new Date(ticket.created_at), "HH:mm")}</span>
                                </div>
                                {!isEditing ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEdit}
                                        className="h-7 px-2 text-xs rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        <span>Düzenle</span>
                                    </Button>
                                ) : (
                                    <div className="flex gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="h-7 px-2 text-xs rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <X className="h-3 w-3 mr-1 text-red-500" />
                                            <span>İptal</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSave}
                                            className="h-7 px-2 text-xs rounded-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/10 dark:text-green-300 dark:border-green-800/50 dark:hover:bg-green-800/20 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <Check className="h-3 w-3 mr-1" />
                                            <span>Kaydet</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3 mt-1">
                                <div className="relative">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Bilet başlığı"
                                        className="font-medium text-base border border-blue-200 dark:border-blue-800/70 focus-visible:ring-blue-500 rounded-lg pl-3 pr-3 py-1.5 shadow-sm"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="relative">
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Bilet açıklaması"
                                        rows={8}
                                        className="resize-none min-h-[180px] border border-blue-200 dark:border-blue-800/70 focus-visible:ring-blue-500 rounded-lg p-3 shadow-sm"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800/40 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700/30 mt-1">
                                <div className="flex items-center gap-1.5 px-3 py-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">{title}</h3>
                                </div>
                                
                                <Collapsible 
                                    open={isDescriptionOpen} 
                                    onOpenChange={setIsDescriptionOpen}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-full flex justify-between text-xs text-muted-foreground border-t border-gray-100 dark:border-gray-700/30">
                                            <span>Açıklama Detayları</span>
                                            <span>{isDescriptionOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-3 pb-3">
                                        <div className="text-gray-700 dark:text-gray-300 ticket-description prose prose-xs max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-p:text-gray-600 dark:prose-p:text-gray-300 text-sm">
                                            {processHtmlContent(ticket.description)}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}