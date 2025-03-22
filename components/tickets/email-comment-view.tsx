"use client"

import { useState } from "react"
import { TicketComment, FileAttachment } from "@/types/tickets"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { Download, FileIcon, FileText, Image, Mail, Reply, ReplyAll, Paperclip, ChevronDown, ChevronUp } from "lucide-react"
import { processHtmlContent } from "@/utils/text-utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface FilePreviewProps {
    file: FileAttachment
}

function FilePreview({ file }: FilePreviewProps) {
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
            
            <span className="max-w-[200px] truncate">{file.name || file.originalFilename}</span>
            
            <Download className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    )
}

interface EmailCommentViewProps {
    comment: TicketComment;
    onReply: (comment: TicketComment, replyAll: boolean) => void;
}

export function EmailCommentView({ comment, onReply }: EmailCommentViewProps) {
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    
    // Use HTML content if available, otherwise use regular content
    const displayContent = comment.html_content 
        ? processHtmlContent(comment.html_content) 
        : processHtmlContent(comment.content);
    
    return (
        <Card 
            className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30"
        >
            <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 dark:bg-blue-700 text-white">
                        {comment.sender 
                            ? comment.sender.split(' ').map(n => n[0]).join('').toUpperCase()
                            : (comment.created_by_name 
                                ? comment.created_by_name.split(' ').map(n => n[0]).join('').toUpperCase()
                                : 'M')}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                            <span>{comment.sender || comment.created_by_name || 'Unknown User'}</span>
                            <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-200 bg-blue-50">
                                <Mail className="h-3 w-3" />
                                <span className="text-xs">Email</span>
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { 
                                addSuffix: true,
                                locale: tr 
                            })}
                        </div>
                    </div>
                    
                    {/* Email metadata collapsible section */}
                    <Collapsible 
                        open={isMetadataOpen} 
                        onOpenChange={setIsMetadataOpen}
                        className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900/50"
                    >
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full flex justify-between text-xs text-muted-foreground">
                                <span>Email Details</span>
                                <span>{isMetadataOpen ? '▲' : '▼'}</span>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pt-2 text-xs">
                            {comment.sender_email && (
                                <div className="flex gap-2">
                                    <span className="font-medium min-w-[60px]">From:</span>
                                    <span>{comment.sender_email}</span>
                                </div>
                            )}
                            {comment.to_recipients && comment.to_recipients.length > 0 && (
                                <div className="flex gap-2">
                                    <span className="font-medium min-w-[60px]">To:</span>
                                    <span>{comment.to_recipients.join(', ')}</span>
                                </div>
                            )}
                            {comment.cc_recipients && comment.cc_recipients.length > 0 && (
                                <div className="flex gap-2">
                                    <span className="font-medium min-w-[60px]">CC:</span>
                                    <span>{comment.cc_recipients.join(', ')}</span>
                                </div>
                            )}
                            {comment.email_id && (
                                <div className="flex gap-2">
                                    <span className="font-medium min-w-[60px]">Email ID:</span>
                                    <span className="text-gray-500">{comment.email_id}</span>
                                </div>
                            )}
                            {comment.thread_id && (
                                <div className="flex gap-2">
                                    <span className="font-medium min-w-[60px]">Thread ID:</span>
                                    <span className="text-gray-500">{comment.thread_id}</span>
                                </div>
                            )}
                            {comment.content && (
                                <div className="flex flex-col gap-1 mb-2">
                                    <span className="font-medium">Konu:</span>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-gray-800 dark:text-gray-200 font-medium">
                                        {comment.content}
                                    </div>
                                </div>
                            )}
                            {comment.html_content && (
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium">İçerik Önizleme:</span>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-gray-600 dark:text-gray-300 max-h-96 overflow-auto">
                                        <div className="prose dark:prose-invert max-w-none prose-ul:pl-5 prose-ol:pl-5 prose-li:my-0 prose-p:my-1 prose-headings:mt-2 prose-headings:mb-1">
                                            {processHtmlContent(comment.html_content)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="font-medium">Ekler:</span>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                                        {comment.attachments.map((file) => (
                                            <div key={file.id || `file-${Math.random()}`} className="flex items-center gap-2 text-xs py-1">
                                                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {file.name || file.originalFilename || (file.url && file.url.split('/').pop()) || 'Dosya'}
                                                </a>
                                                <span className="text-gray-500 text-[10px]">
                                                    ({file.size ? `${Math.round(file.size / 1024)}KB` : 'Boyut bilinmiyor'})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                    
                    {/* Email content */}
                    <div 
                        className="text-sm text-foreground/90 ticket-description mt-3"
                        dangerouslySetInnerHTML={{ __html: typeof displayContent === 'string' ? displayContent : '' }}
                    />
                    
                    {/* Attachments */}
                    {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {comment.attachments.map((file) => (
                                <FilePreview key={file.id || `file-${Math.random()}`} file={file} />
                            ))}
                        </div>
                    )}
                    
                    {/* Reply buttons */}
                    <div className="flex gap-2 mt-4">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                                try {
                                    console.log("Reply button clicked", comment);
                                    onReply(comment, false);
                                } catch (error) {
                                    console.error("Error in Reply button:", error);
                                }
                            }}
                        >
                            <Reply className="h-3.5 w-3.5" />
                            <span>Reply</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                                try {
                                    console.log("Reply All button clicked", comment);
                                    onReply(comment, true);
                                } catch (error) {
                                    console.error("Error in Reply All button:", error);
                                }
                            }}
                        >
                            <ReplyAll className="h-3.5 w-3.5" />
                            <span>Reply All</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
