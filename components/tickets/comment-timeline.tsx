"use client"

import { TicketComment, FileAttachment } from "@/types/tickets"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, isValid } from "date-fns"
import { tr } from "date-fns/locale"
import { Download, FileIcon, FileText, Image, Paperclip, ChevronDown, ChevronUp } from "lucide-react"
import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from "react"
import { processHtmlContent, decodeHtml, normalizeNewlines } from "@/utils/text-utils"
import { EmailCommentView } from "./email-comment-view"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CommentTimelineProps {
    comments: TicketComment[];
    onReplyToEmail?: (comment: TicketComment, replyAll: boolean) => void;
}

function FilePreview({ file }: { file: FileAttachment }) {
    const fileType = file.type || file.mimeType || '';
    const isImage = fileType.startsWith('image/')
    const isPDF = fileType === 'application/pdf'
    const isDoc = fileType.includes('word') || fileType.includes('doc')
    const isSpreadsheet = fileType.includes('excel') || fileType.includes('sheet')

    return (
        <a 
            href={`api/images/${file.name || file.originalFilename || (file.url && file.url.split('/').pop()) || 'Dosya'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs bg-background/50 hover:bg-background/80 px-3 py-2 rounded-md transition-colors group"
        >
            {isImage ? (
                <Image className="h-4 w-4 text-blue-500" />
            ) : isPDF ? (
                <FileText className="h-4 w-4 text-red-500" />
            ) : isDoc ? (
                <FileIcon className="h-4 w-4 text-blue-500" />
            ) : isSpreadsheet ? (
                <FileIcon className="h-4 w-4 text-green-500" />
            ) : (
                <Paperclip className="h-4 w-4 text-gray-500" />
            )}
            
            <span className="max-w-[200px] truncate">{file.originalFilename || file.name}</span>
            
            <Download className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    )
}

function CommentContent({ content }: { content: string }) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // Use our enhanced processHtmlContent function to handle all text processing
    const processedContent = processHtmlContent(content);
    
    useEffect(() => {
        if (contentRef.current) {
            // Find all link tags
            const links = contentRef.current.querySelectorAll('a');
            
            // Set target and rel attributes for each link
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                link.classList.add('text-blue-600', 'hover:text-blue-800', 'hover:underline');
            });
        }
    }, [content]);
    
    // HTML etiketlerini kaldırarak düz metni elde et
    let plainText = '';
    if (typeof content === 'string') {
        // HTML içeriğini düz metne çevir
        plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // İçerik uzunluğu kontrolü - 50 karakterden uzunsa daraltılabilir yap
    const CHARACTER_LIMIT = 100;
    const isLongContent = plainText.length > CHARACTER_LIMIT;
    
    // Kısa bir önizleme metni oluştur
    const previewText = plainText.length > 0 
        ? plainText.substring(0, CHARACTER_LIMIT) + (plainText.length > CHARACTER_LIMIT ? '...' : '')
        : 'Yorum içeriğini görmek için tıklayın';
    
    // Kısa içerik için doğrudan göster
    if (!isLongContent) {
        return (
            <div 
                ref={contentRef}
                className="text-sm text-foreground/90 ticket-description"
                dangerouslySetInnerHTML={{ __html: typeof processedContent === 'string' ? processedContent : content }}
            />
        );
    }
    
    // Uzun içerik için daraltılabilir yapı kullan
    return (
        <div className="text-sm text-foreground/90">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Önizleme metni - sadece kapalıyken göster */}
                {!isOpen && (
                    <div className="text-sm text-foreground/90 line-clamp-2 mt-1">
                        {previewText}
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1 inline-flex items-center justify-center">
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                )}
                
                <CollapsibleContent>
                    <div className="flex items-center justify-end mb-1">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <ChevronUp className="h-3 w-3" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <div 
                        ref={contentRef}
                        className="ticket-description"
                        dangerouslySetInnerHTML={{ __html: typeof processedContent === 'string' ? processedContent : content }}
                    />
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

export function CommentTimeline({ comments, onReplyToEmail }: CommentTimelineProps) {
    // Yorumları eskiden yeniye doğru sıralayarak, gösterimin tutarlı olmasını sağlayalım
    const sortedComments = [...comments].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateA.getTime() - dateB.getTime(); // Eskiden yeniye doğru sıralama
    });
    
    return (
        <div className="space-y-4">
            {sortedComments.map((comment) => (
                // If comment has email_id, render it as an email comment
                comment.email_id ? (
                    <EmailCommentView 
                        key={comment.id} 
                        comment={comment} 
                        onReply={(comment, replyAll) => {
                            if (onReplyToEmail) {
                                try {
                                    onReplyToEmail(comment, replyAll);
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }} 
                    />
                ) : (
                    <Card 
                        key={comment.id} 
                        className={cn(
                            "p-3",
                            comment.is_internal 
                                ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30"
                                : "bg-white/50 dark:bg-gray-900/50"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn(
                                    "text-white text-xs",
                                    comment.is_internal 
                                        ? "bg-amber-500 dark:bg-amber-700"
                                        : "bg-blue-500 dark:bg-blue-700"
                                )}>
                                    {comment.created_by_name 
                                        ? comment.created_by_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                        : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">
                                        {comment.created_by_name || 'Unknown User'}
                                        {comment.is_internal && (
                                            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                                İç Not
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        {(() => {
                                            try {
                                                if (!comment.created_at) return "Tarih bilinmiyor";
                                                const date = new Date(comment.created_at);
                                                return isValid(date) 
                                                    ? formatDistanceToNow(date, { 
                                                        addSuffix: true,
                                                        locale: tr 
                                                      })
                                                    : "Geçersiz tarih";
                                            } catch (error) {
                                                return "Tarih bilinmiyor";
                                            }
                                        })()}
                                    </div>
                                </div>
                                
                                <CommentContent content={comment.content} />

                                {comment.attachments && comment.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {comment.attachments.map((file, index) => (
                                            <FilePreview key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )
            ))}
        </div>
    )
}