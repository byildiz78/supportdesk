"use client"

import { Card } from "@/components/ui/card"
import { User } from "lucide-react"
import { CommentTimeline } from "@/components/tickets/comment-timeline"
import { CommentForm } from "@/components/tickets/comment-form"
import { FileUpload } from "./file-upload"
import { EditableTicketDetails } from "./editable-ticket-details"
import { useState } from "react"
import { useTicketStore } from "@/stores/ticket-store"

interface TicketContentProps {
    ticket: {
        id: string;
        title: string;
        description: string;
        customer_name: string | null;
        created_at: string;
        comments?: any[];
        attachments?: any[];
        status: string;
        priority: string;
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
}

interface TicketComment {
    ticket_id: string;
    content: string;
    is_internal: boolean;
    created_at: string;
    created_by: string;
    created_by_name: string;
    attachments?: {
        id: string;
        name: string;
        size: number;
        type: string;
        url: string;
        uploaded_at: string;
        uploaded_by: string;
    }[];
}

export function TicketContent({ ticket }: TicketContentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addComment, addAttachments, updateTicket } = useTicketStore()

    const handleSubmitComment = async (content: string, isInternal: boolean, files?: File[]) => {
        if (!ticket) return;
        
        setIsSubmitting(true)
        try {
            // 1. First upload any files if they exist
            let uploadedAttachments: any[] = [];
            
            if (files && files.length > 0) {
                const formData = new FormData();
                
                // Add each file to the form data
                files.forEach(file => {
                    formData.append('file', file);
                });
                
                // Add metadata
                formData.append('entityType', 'ticket'); // Associate directly with the ticket
                formData.append('entityId', ticket.id); // Use the ticket ID
                formData.append('createdBy', '1f56b863-0363-407f-8466-b9495b8b4ff9'); // Use a valid UUID format
                
                // Upload the files
                const uploadResponse = await fetch('/supportdesk/api/main/files/uploadFile', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('File upload failed');
                }
                
                const uploadResult = await uploadResponse.json();
                uploadedAttachments = uploadResult.files || [];
            }
            
            // 2. Create the comment with the uploaded files
            const commentData = {
                ticketId: ticket.id,
                content,
                isInternal,
                createdBy: '1f56b863-0363-407f-8466-b9495b8b4ff9', // Use a valid UUID format
                attachments: uploadedAttachments
            };
            
            // Call the API to add the comment
            const response = await fetch('/supportdesk/api/main/tickets/addTicketComment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData),
            });
            
            if (!response.ok) {
                throw new Error('Failed to add comment');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update the UI with the new comment
                addComment(ticket.id, result.comment);
            } else {
                throw new Error(result.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Yorum eklenirken hata oluştu:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileUploadComplete = (uploadedFiles: any[]) => {
        // Add the uploaded files to the ticket store
        if (ticket && uploadedFiles.length > 0) {
            addAttachments(ticket.id, uploadedFiles);
        }
    };

    const handleTicketUpdate = (updatedTicket: any) => {
        // Update the ticket in the store
        updateTicket(updatedTicket);
    };

    return (
        <>
            {/* Original Description */}
            <EditableTicketDetails 
                ticket={ticket} 
                onUpdate={handleTicketUpdate} 
            />

            {/* Comments */}
            {ticket.comments && ticket.comments.length > 0 ? (
                <Card className="p-6 mb-6">
                    <div>
                        <p className="mb-2 text-sm text-gray-500">Yorumlar: {ticket.comments.length}</p>
                        <div className="max-h-[400px] overflow-y-auto pr-2">
                            <CommentTimeline comments={ticket.comments} />
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="p-6 mb-6 text-center">
                    <p className="text-gray-500">Henüz yorum yok</p>
                    <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-20">
                        ticket.comments: {JSON.stringify(ticket.comments, null, 2)}
                    </pre>
                </Card>
            )}

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 ? (
                <Card className="p-6 mb-6">
                    <div>
                        <p className="mb-2 text-sm text-gray-500">Eklentiler: {ticket.attachments.length}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ticket.attachments.map((attachment) => (
                                <div key={attachment.id} className="border rounded-md p-3 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium truncate" title={attachment.originalFilename}>
                                            {attachment.originalFilename}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {Math.round(attachment.size / 1024)} KB
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="text-xs text-gray-500">
                                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                                        </span>
                                        <a 
                                            href={attachment.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            İndir
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            ) : null}

            {/* File Upload */}
            <Card className="p-6 mb-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium">Dosya Ekle</h3>
                    <p className="text-sm text-gray-500">Bilete dosya eklemek için aşağıdaki alanı kullanın</p>
                </div>
                <FileUpload 
                    ticketId={ticket.id} 
                    onUploadComplete={handleFileUploadComplete} 
                />
            </Card>

            {/* Comment Input */}
            <Card className="p-4 mt-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                <CommentForm onSubmit={handleSubmitComment} />
            </Card>
        </>
    )
}
