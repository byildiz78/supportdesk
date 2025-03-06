"use client"

import { TicketComment, FileAttachment } from "@/types/tickets"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { Download, FileIcon, FileText, Image, Paperclip } from "lucide-react"

interface CommentTimelineProps {
    comments: TicketComment[]
}

function FilePreview({ file }: { file: FileAttachment }) {
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    const isDoc = file.type.includes('word') || file.type.includes('doc')
    const isSpreadsheet = file.type.includes('excel') || file.type.includes('sheet')

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

export function CommentTimeline({ comments }: CommentTimelineProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <Card 
                    key={comment.id} 
                    className={cn(
                        "p-4",
                        comment.isInternal 
                            ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30"
                            : "bg-white/50 dark:bg-gray-900/50"
                    )}
                >
                    <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className={cn(
                                "text-white",
                                comment.isInternal 
                                    ? "bg-amber-500 dark:bg-amber-700"
                                    : "bg-blue-500 dark:bg-blue-700"
                            )}>
                                {comment.createdByName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">
                                    {comment.createdByName}
                                    {comment.isInternal && (
                                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                            İç Not
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.createdAt), { 
                                        addSuffix: true,
                                        locale: tr 
                                    })}
                                </div>
                            </div>
                            
                            <div className="text-sm text-foreground/90">
                                {comment.content}
                            </div>

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
            ))}
        </div>
    )
}