"use client"

import { Card } from "@/components/ui/card"
import { User } from "lucide-react"
import { CommentTimeline } from "@/components/tickets/comment-timeline"
import { CommentForm } from "@/components/tickets/comment-form"
import { FileUpload } from "./file-upload"
import { EditableTicketDetails } from "./editable-ticket-details"
import { TicketTags } from "./ticket-tags"
import { useState } from "react"
import { useTicketStore } from "@/stores/ticket-store"
import { getUserId, getUserName } from "@/utils/user-utils"
import axios from "@/lib/axios"
import { EmailReplyForm } from "@/components/tickets/email-reply-form"
import { TicketComment, FileAttachment } from "@/types/tickets"
import DOMPurify from 'dompurify';

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
        ticketno?: string | null;
    };
}

export function TicketContent({ ticket }: TicketContentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [replyingToEmail, setReplyingToEmail] = useState<TicketComment | null>(null)
    const [replyAll, setReplyAll] = useState(false)
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
                
                // API'nin beklediği entityType ve createdBy parametrelerini ekleyelim
                formData.append('entityType', 'ticket');
                formData.append('entityId', ticket.id);
                formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9');
                
                // Upload the files
                const uploadResponse = await axios.post('/api/main/files/uploadFile', formData);
                
                if (!uploadResponse.data.success) {
                    throw new Error('File upload failed');
                }
                
                const uploadResult = uploadResponse.data;
                
                // API yanıtındaki dosya bilgilerini kullan
                if (uploadResult.files && uploadResult.files.length > 0) {
                    uploadedAttachments = uploadResult.files.map((file: any) => {
                        return {
                            id: file.id,
                            name: file.name,
                            originalFilename: file.originalFilename || file.name,
                            size: file.size,
                            mimeType: file.mimeType,
                            url: file.url,
                            storagePath: file.storagePath || `/uploads/${file.name}`,
                            uploadedAt: file.uploadedAt || new Date().toISOString(),
                            uploadedBy: file.uploadedBy || uploadResult.metadata.createdBy
                        };
                    });
                } 
                // Eğer API dosya bilgilerini döndürmediyse ve metadata varsa
                else if (uploadResult.metadata && (!uploadResult.files || uploadResult.files.length === 0) && files && files.length > 0) {
                    
                    // Yüklenen dosyaları kullanarak dosya bilgilerini oluştur
                    uploadedAttachments = files.map((file, index) => {
                        // Benzersiz bir ID oluştur
                        const fileId = `temp-${Date.now()}-${index}`;
                        // Dosya adını al
                        const fileName = file.name;
                        // Dosya uzantısını al
                        const fileExt = fileName.substring(fileName.lastIndexOf('.'));
                        // Dosya boyutunu al
                        const fileSize = file.size;
                        // Dosya tipini al
                        const fileType = file.type;
                        // Dosya URL'ini oluştur
                        const fileUrl = `${uploadResult.metadata.basePath}/uploads/${fileId}${fileExt}`;
                        
                        return {
                            id: fileId,
                            name: fileName,
                            originalFilename: fileName,
                            size: fileSize,
                            mimeType: fileType,
                            url: fileUrl,
                            uploadedAt: new Date().toISOString(),
                            uploadedBy: uploadResult.metadata.createdBy
                        };
                    });
                } else {
                    uploadedAttachments = [];
                }
            }
            
            // 2. Create the comment with the uploaded files
            const commentData = {
                ticketId: ticket.id,
                content,
                isInternal,
                createdBy: getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9', // Önce localStorage'dan userId'yi al, yoksa default değeri kullan
                attachments: uploadedAttachments
            };
            
            // Call the API to add the comment
            const response = await axios.post('/api/main/tickets/addTicketComment', commentData);
            
            if (!response.data.success) {
                throw new Error('Failed to add comment');
            }
            
            const result = response.data;
            
            if (result.success) {
                // Update the UI with the new comment
                addComment(ticket.id, result.comment);
                
                // Eğer ekler varsa, doğrudan UI'a ekleyelim
                if (uploadedAttachments && uploadedAttachments.length > 0) {
                    // API'den dönen dosya formatını store'un beklediği formata dönüştür
                    const formattedAttachments = uploadedAttachments.map((attachment: {
                        id: string;
                        name: string;
                        originalFilename?: string;
                        size: number;
                        mimeType: string;
                        url: string;
                        uploadedAt: string;
                        uploadedBy: string;
                    }) => ({
                        id: attachment.id,
                        name: attachment.originalFilename || attachment.name,
                        size: attachment.size,
                        type: attachment.mimeType,
                        url: attachment.url,
                        uploaded_at: attachment.uploadedAt,
                        uploaded_by: attachment.uploadedBy
                    }));
                    
                    addAttachments(ticket.id, formattedAttachments);
                }
            } else {
                throw new Error(result.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Yorum eklenirken hata oluştu:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReplyAll = (comment: TicketComment) => {
        setReplyingToEmail(comment);
        setReplyAll(true);
    };

    const handleCancelReply = () => {
        setReplyingToEmail(null);
    };

    const handleSubmitEmailReply = async (
        content: string, 
        to: string[], 
        cc: string[], 
        subject: string, 
        isInternal: boolean, 
        files?: File[]
    ) => {
        if (!replyingToEmail || !ticket) return;
        
        setIsSubmitting(true);
        
        try {
            let uploadedAttachments: Array<{
                id: string;
                name: string;
                originalFilename?: string;
                size: number;
                mimeType: string;
                url: string;
                uploadedAt: string;
                uploadedBy: string;
            }> = [];
            
            // Ticket bilgilerini kontrol edelim
            console.log('Ticket bilgileri:', {
                ticketId: ticket.id,
                ticketNo: ticket.ticketno,
                ticketTitle: ticket.title
            });
            
            // 1. Upload files if any
            if (files && files.length > 0) {
                try {
                    console.log('Dosyalar yükleniyor...');
                    const formData = new FormData();
                    
                    files.forEach(file => {
                        formData.append('file', file);
                    });
                    
                    // API'nin beklediği entityType ve createdBy parametrelerini ekleyelim
                    formData.append('entityType', 'ticket');
                    formData.append('entityId', ticket.id);
                    formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9');
                    
                    const uploadResponse = await axios.post('/api/main/files/uploadFile', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    const uploadResult = uploadResponse.data;
                    
                    if (uploadResult.success && uploadResult.files) {
                        console.log('Dosyalar başarıyla yüklendi:', uploadResult.files);
                        
                        // API'den dönen gerçek dosya bilgilerini kullanalım
                        uploadedAttachments = uploadResult.files.map((file: any) => {
                            return {
                                id: file.id,
                                name: file.name,
                                originalFilename: file.originalFilename || file.name,
                                size: file.size,
                                mimeType: file.mimeType,
                                url: file.url,
                                storagePath: file.storagePath || `/uploads/${file.name}`,
                                uploadedAt: file.uploadedAt || new Date().toISOString(),
                                uploadedBy: file.uploadedBy || uploadResult.metadata.createdBy
                            };
                        });
                        
                        console.log('Yorum için hazırlanan ekler:', uploadedAttachments);
                    } else {
                        uploadedAttachments = [];
                    }
                } catch (error) {
                    console.error('Dosya yükleme hatası:', error);
                    uploadedAttachments = [];
                }
            }
            
            // 2. Önce yorumu ekleyelim
            const commentData = {
                ticketId: ticket.id,
                content,
                isInternal,
                createdBy: getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9',
                attachments: uploadedAttachments
            };
            
            // Yorumu eklemek için API çağrısı yapalım
            const commentResponse = await axios.post('/api/main/tickets/addTicketComment', commentData);
            
            if (!commentResponse.data.success) {
                throw new Error('Failed to add comment');
            }
            
            const commentResult = commentResponse.data;
            
            // 3. Şimdi e-posta gönderelim
            // Orijinal e-posta içeriğini ekleyelim (Reply All durumunda)
            const originalEmailContent = replyingToEmail.html_content || replyingToEmail.content || '';
            
            // HTML içeriğini hazırlayalım ve güvenli hale getirelim
            // E-posta için string tipinde HTML içeriği kullanmalıyız, React elementleri değil
            const sanitizedContent = DOMPurify.sanitize(content);
            let emailHtmlContent = sanitizedContent;
            
            // Orijinal içeriği ekleyelim
            if (originalEmailContent) {
                // Orijinal içeriğin string olduğundan emin olalım
                const safeOriginalContent = typeof originalEmailContent === 'string' 
                    ? originalEmailContent 
                    : JSON.stringify(originalEmailContent);
                
                // Orijinal içeriği sanitize edelim
                const sanitizedOriginalContent = DOMPurify.sanitize(safeOriginalContent);
                
                // E-posta içeriğine orijinal içeriği ekleyelim
                emailHtmlContent += `<br/><br/><hr/><div class="original-email">
                <p><strong>From:</strong> ${replyingToEmail.sender || ''} &lt;${replyingToEmail.sender_email || ''}&gt;</p>
                <p><strong>Date:</strong> ${new Date(replyingToEmail.created_at).toLocaleString()}</p>
                <p><strong>Subject:</strong> ${replyingToEmail.content || ''}</p>
                <div class="original-content">${sanitizedOriginalContent}</div>
                </div>`;
                
                console.log('Orijinal içerik tipi:', typeof originalEmailContent);
                console.log('İşlenmiş orijinal içerik örneği:', sanitizedOriginalContent.substring(0, 100) + '...');
            }
            
            // Eklenen yorumun ID'sini ve içeriğini alalım
            const commentId = commentResult.comment.id;
            const commentContent = commentResult.comment.content || content;
            
            // Yorum içeriğini subject olarak kullan (ilk 250 karakter)
            let emailSubject = commentContent.trim();
            if (emailSubject.length > 250) {
                emailSubject = emailSubject.substring(0, 240) + '...';
            }
            
            // Eğer subject boşsa, varsayılan bir subject kullan
            if (!emailSubject) {
                emailSubject = 'Re: ' + (replyingToEmail.content || 'Destek Talebiniz Hakkında');
            }
            
            console.log('Yorum içeriğinden alınan subject:', emailSubject);
            console.log('Ticket no:', ticket.ticketno);
            
            // Ticket numarası formatını belirle
            const ticketNoPattern = ticket.ticketno ? `#${ticket.ticketno}#` : '';
            
            // Eğer ticketno değeri varsa ve subject içinde bu format yoksa ekle
            if (ticket.ticketno && ticketNoPattern && !emailSubject.includes(ticketNoPattern)) {
                emailSubject = `${emailSubject} ${ticketNoPattern}`;
                console.log('Ticket numarası eklendi, yeni subject:', emailSubject);
            } else {
                console.log('Ticket numarası eklenemedi veya zaten var:', {
                    hasTicketNo: !!ticket.ticketno,
                    ticketNoPattern,
                    subjectIncludesTicketNo: emailSubject.includes(ticketNoPattern || '')
                });
            }
            
            // API çağrısı için veri hazırla
            const emailData = {
                ticketId: ticket.id,
                content: content,
                htmlContent: emailHtmlContent,
                subject: emailSubject, // Ticket numarası eklenmiş subject değerini kullan
                to: to,
                cc: cc,
                replyToEmailId: replyingToEmail.email_id,
                threadId: replyingToEmail.thread_id,
                isInternal: isInternal,
                userId: getUserId(),
                userName: getUserName(),
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
                commentId: commentId // Eklenen yorumun ID'sini de gönderelim
            };
            
            console.log('API çağrısı yapılıyor:', {
                endpoint: '/api/main/tickets/sendEmailReply',
                data: emailData
            });
            
            const response = await axios.post('/api/main/tickets/sendEmailReply', emailData);
            
            console.log('API yanıtı:', response.data);
            
            if (!response.data.success) {
                throw new Error('Failed to send email reply');
            }
            
            const result = response.data;
            
            if (result.success) {
                // If the API returns the created comment, update the UI
                if (result.comment) {
                    addComment(ticket.id, result.comment);
                    
                    // If there are attachments, add them to the UI
                    if (result.attachments && result.attachments.length > 0) {
                        const formattedAttachments = result.attachments.map((attachment: {
                            id: string;
                            name: string;
                            originalFilename?: string;
                            size: number;
                            mimeType: string;
                            url: string;
                            uploadedAt: string;
                            uploadedBy: string;
                        }) => ({
                            id: attachment.id,
                            name: attachment.originalFilename || attachment.name,
                            size: attachment.size,
                            type: attachment.mimeType,
                            url: attachment.url,
                            uploaded_at: attachment.uploadedAt,
                            uploaded_by: attachment.uploadedBy
                        }));
                        
                        addAttachments(ticket.id, formattedAttachments);
                    }
                } else {
                    // If the API doesn't return the comment, we need to refresh the ticket
                    // This is a fallback in case the API doesn't return the comment
                    console.log('Comment not returned from API, refreshing ticket data may be needed');
                }
                
                // Close the reply form
                setReplyingToEmail(null);
            } else {
                throw new Error(result.message || 'Failed to send email reply');
            }
        } catch (error) {
            console.error('Email reply gönderilirken hata oluştu:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleReplyToEmail = (comment: TicketComment, replyAll: boolean) => {
        try {
            console.log("Reply to email clicked:", comment, replyAll);
            setReplyingToEmail(comment);
            setReplyAll(replyAll);
        } catch (error) {
            console.error("Error in handleReplyToEmail:", error);
        }
    };

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

            {/* Tags */}
            <TicketTags 
                ticketId={ticket.id} 
            />

            {/* Comments */}
            {ticket.comments && ticket.comments.length > 0 ? (
                <Card className="p-6 mb-6">
                    <div>
                        <p className="mb-2 text-sm text-gray-500">Yorumlar: {ticket.comments.length}</p>
                        <div className="pr-2">
                            <CommentTimeline 
                                comments={ticket.comments} 
                                onReplyToEmail={handleReplyToEmail}
                            />
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

            {/* Email Reply Form */}
            {replyingToEmail && (
                <Card className="p-4 mb-6">
                    <EmailReplyForm 
                        originalComment={replyingToEmail}
                        replyAll={replyAll}
                        subject={`Re: ${replyingToEmail.content || ''}`}
                        onSubmit={handleSubmitEmailReply}
                        onCancel={handleCancelReply}
                    />
                </Card>
            )}

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
