"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, User, MessageSquare, Paperclip, Reply, Upload, PenSquare, History, Calendar, Download, FileIcon, Tag } from "lucide-react"
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
import { getTabIcon, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import TicketResolved from "./ticket-resolved"
import TicketCompanyHistory from "./ticket-company-history"

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
    const { addComment, addAttachments, updateTicket, getTicketComments, getTicketAttachments } = useTicketStore()
    const { toast } = useToast()

    // Bilet ID'sine özel yorumları ve ekleri al
    const comments = ticket ? getTicketComments(ticket.id) : []
    // Yorumları eskiden yeniye doğru sıralıyoruz (önce eski yorumlar, sonra yeni yorumlar)
    const sortedComments = [...comments].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateA.getTime() - dateB.getTime(); // Eskiden yeniye doğru sıralama
    });
    const attachments = ticket ? getTicketAttachments(ticket.id) : []

    // Dosya boyutunu formatla (bytes -> KB/MB/GB)
    const formatFileSize = (bytes: number): string => {
        if (!bytes) return "0 B";

        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
    };

    // Tarihi formatla
    const formatDate = (dateString: string | Date): string => {
        if (!dateString) return "";

        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        // Tarih geçerli değilse
        if (isNaN(date.getTime())) return "";

        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleSubmitComment = async (content: string, isInternal: boolean, files?: File[]) => {
        if (!ticket) return;

        setIsSubmitting(true);

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
                        originalFilename: attachment.originalFilename,
                        name: attachment.name,
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
                filename?: string;
                size: number;
                mimeType: string;
                url: string;
                uploadedAt: string;
                uploadedBy: string;
            }> = [];

            if (files && files.length > 0) {
                try {
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
                        uploadedAttachments = uploadResult.files.map((file: any) => {
                            return {
                                id: file.id,
                                name: file.name,
                                originalFilename: file.originalFilename || file.name,
                                filename: file.filename || file.name,
                                size: file.size,
                                mimeType: file.mimeType,
                                url: file.url,
                                storagePath: file.storagePath || `/uploads/${file.name}`,
                                uploadedAt: file.uploadedAt || new Date().toISOString(),
                                uploadedBy: file.uploadedBy || uploadResult.metadata.createdBy
                            };
                        });
                    } else {
                        uploadedAttachments = [];
                    }
                } catch (error) {
                    console.error('Dosya yükleme hatası:', error);
                    uploadedAttachments = [];
                }
            }

            // Orijinal e-posta içeriğini ekleyelim (Reply All durumunda)
            const originalEmailContent = replyingToEmail.html_content || replyingToEmail.content || '';
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
                emailHtmlContent += `<br/><br/><hr/><div class="original-email" style="margin-top: 20px; padding: 10px; border-left: 2px solid #ccc;">
                <p><strong>From:</strong> ${replyingToEmail.sender || ''} &lt;${replyingToEmail.sender_email || ''}&gt;</p>
                <p><strong>Date:</strong> ${new Date(replyingToEmail.created_at).toLocaleString()}</p>
                ${replyingToEmail.to_recipients && replyingToEmail.to_recipients.length > 0 ? 
                  `<p><strong>To:</strong> ${Array.isArray(replyingToEmail.to_recipients) ? 
                    replyingToEmail.to_recipients.join(', ') : 
                    replyingToEmail.to_recipients}</p>` : ''}
                ${replyingToEmail.cc_recipients && replyingToEmail.cc_recipients.length > 0 ? 
                  `<p><strong>Cc:</strong> ${Array.isArray(replyingToEmail.cc_recipients) ? 
                    replyingToEmail.cc_recipients.join(', ') : 
                    replyingToEmail.cc_recipients}</p>` : ''}
                <p><strong>Subject:</strong> ${replyingToEmail.content || ''}</p>
                <div class="original-content" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">${sanitizedOriginalContent}</div>
                </div>`;
            }

            // Yorum içeriğini subject olarak kullan (ilk 250 karakter)
            let emailSubject = content.trim();
            if (emailSubject.length > 250) {
                emailSubject = emailSubject.substring(0, 240) + '...';
            }

            // Eğer subject boşsa, varsayılan bir subject kullan
            if (!emailSubject) {
                emailSubject = 'Re: ' + (replyingToEmail.content || 'Destek Talebiniz Hakkında');
            }

            // Ticket numarası formatını belirle
            const ticketNoPattern = ticket.ticketno ? `#${ticket.ticketno}#` : '';

            // Eğer ticketno değeri varsa ve subject içinde bu format yoksa ekle
            if (ticket.ticketno && ticketNoPattern && !emailSubject.includes(ticketNoPattern)) {
                emailSubject = `${emailSubject} ${ticketNoPattern}`;
            }

            // API çağrısı için veri hazırla
            const emailData = {
                ticketId: ticket.id,
                content: content,
                htmlContent: emailHtmlContent,
                subject: replyingToEmail.content, // Ticket numarası eklenmiş subject değerini kullan
                to: to,
                cc: cc,
                replyToEmailId: replyingToEmail.email_id,
                threadId: replyingToEmail.thread_id,
                isInternal: isInternal,
                userId: getUserId(),
                userName: getUserName(),
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
            };

            const response = await axios.post('/api/main/tickets/sendEmailReply', emailData);
            if (!response.data.success) {
                throw new Error('Failed to send email reply');
            }

            const result = response.data;

            if (result.success) {
                // If the API returns the created comment, update the UI
                if (result.comment) {
                    // API'den dönen yorumu frontend'in beklediği formata dönüştür
                    const formattedComment: TicketComment = {
                        id: result.comment.id,
                        ticket_id: result.comment.ticketId,
                        content: result.comment.content,
                        is_internal: result.comment.isInternal,
                        created_at: result.comment.createdAt,
                        created_by: result.comment.createdBy,
                        created_by_name: result.comment.createdByName || result.comment.sender,
                        email_id: result.comment.emailId,
                        thread_id: result.comment.threadId,
                        sender: result.comment.sender,
                        sender_email: "robotpos@gmail.com",
                        to_recipients: result.comment.toRecipients,
                        cc_recipients: result.comment.ccRecipients,
                        html_content: result.comment.htmlContent,
                        attachments: result.comment.attachments
                    };

                    // Store'a formatlanmış yorumu ekle
                    addComment(ticket.id, formattedComment);

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
                            name: attachment.name,
                            originalFilename: attachment.originalFilename,
                            size: attachment.size,
                            type: attachment.mimeType,
                            url: attachment.url,
                            uploaded_at: attachment.uploadedAt,
                            uploaded_by: attachment.uploadedBy
                        }));

                        addAttachments(ticket.id, formattedAttachments);
                    } else if (uploadedAttachments.length > 0) {
                        // API ekler dönmediyse ama yüklenen ekler varsa onları kullan
                        const formattedAttachments = uploadedAttachments.map(attachment => ({
                            id: attachment.id,
                            name: attachment.name,
                            originalFilename: attachment.originalFilename,
                            size: attachment.size,
                            type: attachment.mimeType,
                            url: attachment.url,
                            uploaded_at: attachment.uploadedAt,
                            uploaded_by: attachment.uploadedBy
                        }));

                        addAttachments(ticket.id, formattedAttachments);
                    }
                }
                setReplyingToEmail(null);
            }
        } catch (error) {
            console.error('Email reply gönderilirken hata oluştu:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleReplyToEmail = (comment: TicketComment, replyAll: boolean) => {
        try {
            setReplyingToEmail(comment);
            setReplyAll(replyAll);
        } catch (error) {
            console.error("Error in handleReplyToEmail:", error);
        }
    };

    const handleTicketUpdate = (updatedTicket: any) => {
        // Update the ticket in the store
        updateTicket(updatedTicket);
    };

    return (
        <div className="space-y-4">
            {/* Comments */}
            {sortedComments && sortedComments.length > 0 ? (
                <Card className="overflow-hidden border-0 shadow-sm rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md">
                                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                                Yorumlar <span className="ml-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">{sortedComments.length}</span>
                            </h3>
                        </div>
                        <div className="pr-2">
                            <CommentTimeline
                                comments={sortedComments}
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
            {attachments && attachments.length > 0 ? (
                <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                <Paperclip className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Eklentiler <span className="ml-2 px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">{attachments.length}</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {attachments.map((attachment) => (
                                <div key={attachment.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 max-w-[70%]">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full flex-shrink-0">
                                                <FileIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                {attachment.originalFilename || attachment.filename || attachment.name}
                                            </span>
                                        </div>
                                        <a
                                            href={`api/images/${attachment.name || attachment.url}`}
                                            download={`api/images/${attachment.name || attachment.url}`}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                                        <span>
                                            {formatFileSize(attachment.size)}
                                        </span>
                                        <span>
                                            {formatDate(attachment.created_at || attachment.uploaded_at)}
                                        </span>
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

            <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="p-2">
                    <Tabs defaultValue="comment" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3">
                            <TabsList className="bg-transparent border-b pb-px w-full flex justify-start">
                                <TabsTrigger
                                    value="comment"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("comments")}
                                >
                                    <span className="hidden sm:inline">Yorum Ekle</span>
                                    <span className="sm:hidden">Yorum</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="file"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("attachments")}
                                >
                                    <span className="hidden sm:inline">Dosya Ekle</span>
                                    <span className="sm:hidden">Dosya</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tags"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-600 data-[state=active]:text-gray-700 dark:data-[state=active]:text-gray-300 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("tags")}
                                >
                                    <span className="hidden sm:inline">Etiketler</span>
                                    <span className="sm:hidden">Etiket</span>
                                </TabsTrigger>
                                {ticket.status === "resolved" && (
                                    <TabsTrigger
                                        value="resolved"
                                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                        icon={getTabIcon("resolved")}
                                    >
                                        <span className="hidden sm:inline">Çözüm Notları</span>
                                        <span className="sm:hidden">Çözüm Notları</span>
                                    </TabsTrigger>
                                )}

                                <TabsTrigger
                                    value="companyHistory"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("companyHistory")}
                                >
                                    <span className="hidden sm:inline">Ticket Geçmişi</span>
                                    <span className="sm:hidden">Geçmiş</span>
                                </TabsTrigger>

                                {/* <TabsTrigger
                                    value="message"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("message")}
                                >
                                    <span className="hidden sm:inline">Mesaj Gönder</span>
                                    <span className="sm:hidden">Mesaj</span>
                                </TabsTrigger> */}

                                <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-400 rounded-none py-2 px-3 transition-all duration-200 flex-shrink-0 text-sm whitespace-nowrap"
                                    icon={getTabIcon("history")}
                                >
                                    <span className="hidden sm:inline">Durum Geçmişi</span>
                                    <span className="sm:hidden">Geçmiş</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="comment" className="mt-2">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900/50 dark:to-indigo-800/50 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                                        <PenSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Yorum Ekle
                                    </h3>
                                </div>
                                {ticket && (
                                    <CommentForm
                                        ticketId={ticket.id}
                                        mobil={ticket.customer_phone || ''}
                                        email={ticket.customer_email || ''}
                                        ticketNo={ticket.ticketno || undefined}
                                        comments={comments}
                                        onSubmit={handleSubmitComment}
                                    />
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="mt-2">
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
                                    onSubmit={(files, attachments) => {
                                        // No need to explicitly call addAttachments since the FileUpload component now handles it
                                    }}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="tags" className="mt-2">
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

                        <TabsContent value="resolved" className="mt-2">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900/50 dark:to-red-900/30 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-red-200 dark:bg-red-800/50 p-2 rounded-full">
                                        <CheckCircle2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Çözüm Notları
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bilet çözüm detayları ve durumu</p>
                                <TicketResolved ticketId={ticket.id} />
                            </div>
                        </TabsContent>

                        <TabsContent value="companyHistory" className="mt-2">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900/50 dark:to-purple-900/30 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                        <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Ticket Geçmişi
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Biletin durum değişikliklerinin kronolojik geçmişi</p>
                                <TicketCompanyHistory ticketId={ticket.id} />
                            </div>
                        </TabsContent>

                        {/* <TabsContent value="message" className="mt-2">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900/50 dark:to-green-900/30 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Mesaj Gönder
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Mesaj göndermek için buraya tıklayınız</p>
                                <TicketChatSend 
                                    mobil={ticket.customer_phone || undefined} 
                                    ticketNo={ticket.ticketno || undefined}
                                    customerName={ticket.customer_name || undefined}
                                />
                            </div>
                        </TabsContent> */}

                        <TabsContent value="history" className="mt-2">
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

                    </Tabs>
                </div>
            </Card>
        </div>
    )
}
