"use client"

import { Card } from "@/components/ui/card"
import { User } from "lucide-react"
import { CommentTimeline } from "@/components/tickets/comment-timeline"
import { CommentForm } from "@/components/tickets/comment-form"
import { FileUpload } from "./file-upload"
import { EditableTicketDetails } from "./editable-ticket-details"
import { TicketTags } from "./ticket-tags"
import { TicketStatusHistory } from "./ticket-status-history"
import { useState } from "react"
import { useTicketStore } from "@/stores/ticket-store"
import { getUserId, getUserName } from "@/utils/user-utils"
import axios from "@/lib/axios"
import { EmailReplyForm } from "@/components/tickets/email-reply-form"
import { TicketComment, FileAttachment } from "@/types/tickets"
import DOMPurify from 'dompurify';
import { MessageSquare, Paperclip, Reply, Upload, PenSquare, History, Calendar, Download, FileIcon, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    const [activeTab, setActiveTab] = useState("comment")
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
        <div className="space-y-6">
            {/* Original Description */}
            <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="border-b border-gray-100 dark:border-gray-700">
                    <EditableTicketDetails 
                        ticket={ticket} 
                        onUpdate={handleTicketUpdate} 
                    />
                </div>
            </Card>

            {/* Comments */}
            {ticket.comments && ticket.comments.length > 0 ? (
                <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Yorumlar <span className="ml-2 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">{ticket.comments.length}</span>
                            </h3>
                        </div>
                        <div className="pr-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                            <CommentTimeline 
                                comments={ticket.comments} 
                                onReplyToEmail={handleReplyToEmail}
                            />
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                                <MessageSquare className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Henüz yorum yok</p>
                    </div>
                </Card>
            )}

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 ? (
                <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                <Paperclip className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Eklentiler <span className="ml-2 px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">{ticket.attachments.length}</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ticket.attachments.map((attachment) => (
                                <div key={attachment.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 max-w-[70%]">
                                            <FileIcon className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                                            <span className="font-medium truncate text-sm" title={attachment.originalFilename}>
                                                {attachment.originalFilename}
                                            </span>
                                        </div>
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                                            {Math.round(attachment.size / 1024)} KB
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')}
                                        </span>
                                        <a 
                                            href={attachment.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
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
                <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                <Reply className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                E-posta Yanıtı
                            </h3>
                        </div>
                        <EmailReplyForm 
                            originalComment={replyingToEmail}
                            replyAll={replyAll}
                            subject={`Re: ${replyingToEmail.content || ''}`}
                            onSubmit={handleSubmitEmailReply}
                            onCancel={handleCancelReply}
                        />
                    </div>
                </Card>
            )}

            {/* Tabbed Interface for Comment, File Upload, Status History, and Tags */}
            <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="p-6">
                    <Tabs defaultValue="comment" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-2">
                            <TabsTrigger 
                                value="comment" 
                                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/40 dark:data-[state=active]:text-indigo-300 rounded-lg py-3 transition-all duration-200"
                            >
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className={`p-1.5 rounded-full ${activeTab === "comment" ? "bg-indigo-200 dark:bg-indigo-800" : ""}`}>
                                        <PenSquare className={`h-4 w-4 ${activeTab === "comment" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`} />
                                    </div>
                                    <span className="hidden md:inline font-medium text-sm">Yorum Ekle</span>
                                    <span className="md:hidden font-medium text-xs">Yorum</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="file" 
                                className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/40 dark:data-[state=active]:text-amber-300 rounded-lg py-3 transition-all duration-200"
                            >
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className={`p-1.5 rounded-full ${activeTab === "file" ? "bg-amber-200 dark:bg-amber-800" : ""}`}>
                                        <Upload className={`h-4 w-4 ${activeTab === "file" ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`} />
                                    </div>
                                    <span className="hidden md:inline font-medium text-sm">Dosya Ekle</span>
                                    <span className="md:hidden font-medium text-xs">Dosya</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="history" 
                                className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700 dark:data-[state=active]:bg-cyan-900/40 dark:data-[state=active]:text-cyan-300 rounded-lg py-3 transition-all duration-200"
                            >
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className={`p-1.5 rounded-full ${activeTab === "history" ? "bg-cyan-200 dark:bg-cyan-800" : ""}`}>
                                        <History className={`h-4 w-4 ${activeTab === "history" ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500 dark:text-gray-400"}`} />
                                    </div>
                                    <span className="hidden md:inline font-medium text-sm">Durum Geçmişi</span>
                                    <span className="md:hidden font-medium text-xs">Geçmiş</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="tags" 
                                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-200 rounded-lg py-3 transition-all duration-200"
                            >
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className={`p-1.5 rounded-full ${activeTab === "tags" ? "bg-gray-300 dark:bg-gray-800" : ""}`}>
                                        <Tag className={`h-4 w-4 ${activeTab === "tags" ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"}`} />
                                    </div>
                                    <span className="hidden md:inline font-medium text-sm">Etiketler</span>
                                    <span className="md:hidden font-medium text-xs">Etiket</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4">
                            <TabsContent value="comment" className="mt-0 border-0 p-0">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900/50 dark:to-indigo-800/50 p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                                            <PenSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Yorum Ekle
                                        </h3>
                                    </div>
                                    <CommentForm onSubmit={handleSubmitComment} />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="file" className="mt-0 border-0 p-0">
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900/50 dark:to-amber-800/50 p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                                            <Upload className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Dosya Ekle
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bilete dosya eklemek için aşağıdaki alanı kullanın</p>
                                    <FileUpload 
                                        ticketId={ticket.id} 
                                        onUploadComplete={handleFileUploadComplete} 
                                    />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="history" className="mt-0 border-0 p-0">
                                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900/50 dark:to-cyan-800/50 p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-full">
                                            <History className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Durum Geçmişi
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Biletin durum değişikliklerinin kronolojik geçmişi</p>
                                    <TicketStatusHistory ticketId={ticket.id} />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="tags" className="mt-0 border-0 p-0">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                                            <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Etiketler
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bileti kategorize etmek için etiketleri yönetin</p>
                                    <TicketTags ticketId={ticket.id} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </Card>
        </div>
    )
}
