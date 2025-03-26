"use client"

import { useState, useRef } from "react"
import { TicketComment } from "@/types/tickets"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Paperclip, Send } from "lucide-react"
import { processHtmlContent } from "@/utils/text-utils"

interface EmailReplyFormProps {
    originalComment: TicketComment;
    replyAll: boolean;
    subject: string;
    onSubmit: (content: string, to: string[], cc: string[], subject: string, isInternal: boolean, files?: File[]) => Promise<void>;
    onCancel: () => void;
}

export function EmailReplyForm({ originalComment, replyAll, subject, onSubmit, onCancel }: EmailReplyFormProps) {
    const [content, setContent] = useState("")
    const [emailSubject, setEmailSubject] = useState(subject)
    const [isInternal, setIsInternal] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Initialize recipients based on replyAll flag
    const [recipients, setRecipients] = useState<string[]>(() => {
        if (originalComment.sender_email) {
            return [originalComment.sender_email];
        }
        return [];
    });
    
    // Initialize CC recipients based on replyAll flag
    const [ccRecipients, setCcRecipients] = useState<string[]>(() => {
        if (replyAll && originalComment.cc_recipients) {
            // Filter out the current user's email if needed
            return originalComment.cc_recipients;
        }
        return [];
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }
    
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }
    
    const handleSubmit = async () => {
        if (!content.trim()) return;
        
        setIsSubmitting(true);
        try {
            // Yorum içeriğini subject olarak kullanmak yerine, 
            // onSubmit fonksiyonuna content, recipients ve ccRecipients'ı ayrı ayrı gönderelim
            await onSubmit(
                content, 
                recipients, 
                ccRecipients,
                emailSubject, 
                isInternal, 
                files.length > 0 ? files : undefined
            );
            setContent("")
            setFiles([])
            onCancel(); // Başarılı gönderim sonrası formu kapat
        } catch (error) {
            console.error('E-posta yanıtı gönderme hatası:', error);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleRecipientsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
        setRecipients(emails);
    };
    
    const handleCcRecipientsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
        setCcRecipients(emails);
    };
    
    return (
        <Card className="p-4 space-y-4 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30">
            <div className="space-y-2">
                <div className="text-sm font-medium">E-posta Yanıtı</div>
                
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="to-recipients">Alıcı:</Label>
                        <Input 
                            id="to-recipients"
                            value={recipients.join(', ')}
                            onChange={handleRecipientsChange}
                            placeholder="recipient@example.com"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label htmlFor="cc-recipients">CC:</Label>
                        <Input 
                            id="cc-recipients"
                            value={ccRecipients.join(', ')}
                            onChange={handleCcRecipientsChange}
                            placeholder="cc@example.com"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label htmlFor="email-subject">Konu:</Label>
                        <Input 
                            id="email-subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Konu"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label htmlFor="reply-content">Mesaj:</Label>
                        <Textarea 
                            id="reply-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Mesajınızı yazınız..."
                            rows={6}
                            className="resize-y"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>
            
            {/* File attachments */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">Eklentiler</div>
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                            <div 
                                key={index} 
                                className="flex items-center gap-2 bg-background/50 px-3 py-2 rounded-md text-xs"
                            >
                                <Paperclip className="h-3 w-3 text-gray-500" />
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <button 
                                    type="button" 
                                    onClick={() => removeFile(index)}
                                    className="text-gray-500 hover:text-red-500"
                                    disabled={isSubmitting}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                    >
                        <Paperclip className="h-4 w-4 mr-1" />
                        Eklenti Ekle
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                        disabled={isSubmitting}
                    />
                    
                    <label className={`flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded border-gray-300"
                            disabled={isSubmitting}
                        />
                        <span className="text-sm">Dahili Not (e-posta olarak gönderilmez)</span>
                    </label>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        className={isSubmitting ? "opacity-80" : ""}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                {isInternal ? "Kaydediliyor..." : "Gönderiliyor..."}
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-1" />
                                {isInternal ? "Kaydet" : "Gönder"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
