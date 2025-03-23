"use client"

import { TicketComment, FileAttachment } from "@/types/tickets"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, isValid } from "date-fns"
import { tr } from "date-fns/locale"
import { Download, FileIcon, FileText, Image, Paperclip } from "lucide-react"
import DOMPurify from 'dompurify';
import { useEffect, useRef } from "react"
import { processHtmlContent, decodeHtml, normalizeNewlines } from "@/utils/text-utils"
import { EmailCommentView } from "./email-comment-view"

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
            href={file.url}
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
            
            <span className="max-w-[200px] truncate">{file.name}</span>
            
            <Download className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    )
}

function CommentContent({ content }: { content: string }) {
    const contentRef = useRef<HTMLDivElement>(null);
    
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
    
    return (
        <div 
            ref={contentRef}
            className="text-sm text-foreground/90 ticket-description"
        >
            {processedContent}
        </div>
    );
}

export function CommentTimeline({ comments, onReplyToEmail }: CommentTimelineProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => (
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
                            "p-4",
                            comment.is_internal 
                                ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30"
                                : "bg-white/50 dark:bg-gray-900/50"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className={cn(
                                    "text-white",
                                    comment.is_internal 
                                        ? "bg-amber-500 dark:bg-amber-700"
                                        : "bg-blue-500 dark:bg-blue-700"
                                )}>
                                    {comment.created_by_name 
                                        ? comment.created_by_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                        : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">
                                        {comment.created_by_name || 'Unknown User'}
                                        {comment.is_internal && (
                                            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                                İç Not
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
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