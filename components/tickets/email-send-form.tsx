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

interface EmailSendFormProps {
    originalComment?: TicketComment;
    replyAll?: boolean;
    subject?: string;
    onSubmit: (content: string, to: string[], cc: string[], subject: string, isInternal: boolean, files?: File[]) => Promise<void>;
    onCancel: () => void;
    ticketMail?: string;
}

export function EmailSendForm({ originalComment, replyAll = false, subject = '', onSubmit, onCancel, ticketMail }: EmailSendFormProps) {
    const [content, setContent] = useState("")
    const [emailSubject, setEmailSubject] = useState(subject || "")
    const [isInternal, setIsInternal] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Initialize recipients - empty by default for new emails
    const [recipients, setRecipients] = useState<string[]>(() => {
        if (ticketMail) {
            return [ticketMail];
        } else if (originalComment?.sender_email) {
            return [originalComment.sender_email];
        }
        return [];
    });
    
    // Initialize CC recipients - empty by default for new emails
    const [ccRecipients, setCcRecipients] = useState<string[]>(() => {
        if (replyAll && originalComment?.cc_recipients) {
            // Destek e-posta adreslerini filtrele
            return originalComment.cc_recipients.filter(email => {
                const normalizedEmail = email.toLowerCase();
                return !normalizedEmail.includes('destek@robotpos.com') && 
                       !normalizedEmail.includes('robotpos destek ekibi');
            });
        }
        return [];
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    }
    
    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    }
    
    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
        setRecipients(emails);
    }
    
    const handleCcRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
        setCcRecipients(emails);
    }
    
    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        try {
            setIsSubmitting(true);
            await onSubmit(content, recipients, ccRecipients, emailSubject, isInternal, files.length > 0 ? files : undefined);
            // Form başarıyla gönderildikten sonra temizle
            setContent("");
            setFiles([]);
            setIsSubmitting(false);
        } catch (error) {
            console.error("E-posta gönderme hatası:", error);
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="space-y-4">
            {/* Alıcılar */}
            <div className="space-y-2">
                <Label htmlFor="recipients" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alıcılar
                </Label>
                <Input
                    id="recipients"
                    placeholder="E-posta adreslerini noktalı virgülle ayırın"
                    value={recipients.join(', ')}
                    onChange={handleRecipientChange}
                    className="w-full"
                />
            </div>
            
            {/* CC Alıcılar */}
            <div className="space-y-2">
                <Label htmlFor="cc-recipients" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CC
                </Label>
                <Input
                    id="cc-recipients"
                    placeholder="CC e-posta adreslerini noktalı virgülle ayırın"
                    value={ccRecipients.join(', ')}
                    onChange={handleCcRecipientChange}
                    className="w-full"
                />
            </div>
            
            {/* Konu */}
            <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Konu
                </Label>
                <Input
                    id="subject"
                    placeholder="E-posta konusu"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full"
                />
            </div>
            
            {/* İçerik */}
            <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    İçerik
                </Label>
                <Textarea
                    id="content"
                    placeholder="E-posta içeriğini yazın..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] w-full"
                />
            </div>
            
            {/* Dosya Ekleri */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="attachments" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ekler
                    </Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs"
                    >
                        <Paperclip className="h-3 w-3 mr-1" />
                        Dosya Ekle
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="attachments"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />
                </div>
                
                {/* Dosya listesi */}
                {files.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* İç not seçeneği */}
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="internal-note"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <Label htmlFor="internal-note" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    İç not olarak kaydet (müşteriye gönderilmez)
                </Label>
            </div>
            
            {/* Butonlar */}
            <div className="flex justify-end space-x-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    İptal
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || recipients.length === 0 || !emailSubject || !content}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isSubmitting ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Gönderiliyor...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <Send className="h-4 w-4 mr-2" />
                            Gönder
                        </span>
                    )}
                </Button>
            </div>
        </div>
    )
}
