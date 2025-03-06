"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Paperclip, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileAttachment } from "@/types/tickets"

interface CommentFormProps {
    onSubmit: (content: string, isInternal: boolean, attachments?: File[]) => void
    className?: string
}

export function CommentForm({ onSubmit, className }: CommentFormProps) {
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
        <div className={cn("space-y-4", className)}>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                className="min-h-[100px]"
            />
            
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        type="button"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    <Select
                        value={isInternal ? "internal" : "public"}
                        onValueChange={(value) => setIsInternal(value === "internal")}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">Genel Yanıt</SelectItem>
                            <SelectItem value="internal">İç Not</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    className={cn(
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                </Button>
            </div>

            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div 
                            key={index}
                            className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md group"
                        >
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm max-w-[200px] truncate">
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}