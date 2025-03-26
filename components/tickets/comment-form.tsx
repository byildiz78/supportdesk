"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Paperclip, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileAttachment } from "@/types/tickets"

interface CommentFormProps {
    ticketId: string;
    onSubmit: (content: string, isInternal: boolean, attachments?: File[]) => void
    className?: string
}

export function CommentForm({ ticketId, onSubmit, className }: CommentFormProps) {
    const [content, setContent] = useState("")
    const [isInternal, setIsInternal] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            await onSubmit(content, isInternal, files)
            setContent("")
            setFiles([])
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setFiles(prev => [...prev, ...selectedFiles])
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className={cn("space-y-3", className)}>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                className="min-h-[80px] resize-none text-sm border-gray-200 dark:border-gray-700 rounded-lg focus-visible:ring-blue-500 shadow-sm"
            />
            
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                    <input
                        type="file"
                        id={`file-upload-${ticketId}`}
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-upload-${ticketId}`)?.click()}
                        type="button"
                        className="h-8 w-8 p-0 rounded-md border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                    </Button>

                    <Select
                        value={isInternal ? "internal" : "public"}
                        onValueChange={(value) => setIsInternal(value === "internal")}
                    >
                        <SelectTrigger className="w-[120px] h-8 text-xs border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public" className="text-xs">Genel Yanıt</SelectItem>
                            <SelectItem value="internal" className="text-xs">İç Not</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    size="sm"
                    className={cn(
                        "bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded-md text-xs font-medium shadow-sm",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Send className="h-3 w-3 mr-1.5" />
                    {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                </Button>
            </div>

            {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {files.map((file, index) => (
                        <div 
                            key={index}
                            className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 rounded text-xs border border-gray-100 dark:border-gray-700/50 group"
                        >
                            <Paperclip className="h-3 w-3 text-gray-400" />
                            <span className="max-w-[180px] truncate text-gray-700 dark:text-gray-300">
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove file"
                            >
                                <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}