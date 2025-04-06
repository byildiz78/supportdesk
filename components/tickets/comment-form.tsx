"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Paperclip, Send, X, Phone, CheckCircle2, XCircle, MessageSquare, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTabStore } from "@/stores/tab-store"
import { FaWhatsapp } from "react-icons/fa"
import axios from "@/lib/axios"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CommentFormProps {
    ticketId: string;
    mobil: string;
    ticketNo?: string;
    onSubmit: (content: string, isInternal: boolean, attachments?: File[]) => void
    className?: string
    comments?: any[]
}

const quickResponses = {
    missed_call: "Merhaba. Sizi aradık ancak ulasamadik. Sorununuz devam ediyorsa bu mesaj üzerinden yorum yapabilirsiniz.",
    need_info: "Merhaba. Sorunuzu cozmenize yardımcı olmak adına daha fazla bilgiye ihtiyacimiz var. Lutfen asagida belirtilen bilgileri bu mesaj üzerinden iletiniz",
    future_service: "Bundan sonra ki servis taleplerinizde, call center ı aradıktan sonra gelen linke tıklayarak yine whatsapp üzerinden bizimle iletişime geçebilirsiniz."
} as const;

export function CommentForm({ ticketId, mobil, ticketNo, onSubmit, className, comments = [] }: CommentFormProps) {
    const [content, setContent] = useState("")
    const [isInternal, setIsInternal] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const [messageType, setMessageType] = useState<"whatsapp" | "sms" | "">("")
    const [quickResponseKey, setQuickResponseKey] = useState<string>("")
    const { addTab, setActiveTab, tabs } = useTabStore()
    const defaultMessagePrefix = useRef<string>("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [showNotification, setShowNotification] = useState(false)
    const [notificationData, setNotificationData] = useState<{
        success: boolean;
        type: 'sms' | 'whatsapp' | 'both';
        message: string;
    } | null>(null)

    // Mesaj tipi değiştiğinde ön eki ekle veya temizle ve dosya eklerini temizle
    useEffect(() => {
        const ticketInfo = ticketNo ? `#${ticketNo}` : '';

        if (messageType === "whatsapp") {
            defaultMessagePrefix.current = `WhatsApp üzerinden ${ticketInfo} destek talebiniz hk. bilgilendirme: `;
            setContent(defaultMessagePrefix.current);
            // WhatsApp seçildiğinde dosya eklerini temizle
            if (files.length > 0) setFiles([]);
        } else if (messageType === "sms") {
            defaultMessagePrefix.current = `SMS üzerinden ${ticketInfo} destek talebiniz hk. bilgilendirme: `;
            setContent(defaultMessagePrefix.current);
            // SMS seçildiğinde dosya eklerini temizle
            if (files.length > 0) setFiles([]);
        } else {
            // Eğer mesaj tipi temizlendiyse ve içerik şablon ile başlıyorsa, içeriği temizle
            if (content.includes("destek talebiniz hk. bilgilendirme:")) {
                setContent("");
            }
        }
    }, [messageType, ticketNo, files.length]);

    // Mesaj değiştiğinde ön eki koru
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const prefix = defaultMessagePrefix.current;

        // Eğer mesaj tipi seçiliyse ve kullanıcı ön eki silmeye çalışıyorsa, izin verme
        if ((messageType === "whatsapp" || messageType === "sms") &&
            prefix && value.length >= 0 && !value.startsWith(prefix)) {
            setContent(prefix);
        } else {
            setContent(value);
        }
    };

    // Bildirim göster
    const showCustomNotification = (success: boolean, type: 'sms' | 'whatsapp' | 'both', message: string) => {
        setNotificationData({
            success,
            type,
            message
        });
        setShowNotification(true);

        // 5 saniye sonra bildirim kaybolsun
        setTimeout(() => {
            setShowNotification(false);
        }, 5000);
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            // Her zaman normal yorum olarak ekle, ama dosya eklerini sadece normal yorumda gönder
            const attachments = messageType === "" ? files : undefined;
            await onSubmit(content, isInternal, attachments);

            // Eğer WhatsApp, SMS veya her ikisi seçiliyse, ek olarak ilgili kanala da gönder
            if (messageType === "whatsapp" || messageType === "sms") {
                await handleSendMessage(messageType)
            }

            setContent("")
            setFiles([])
            setMessageType("") // Mesaj gönderildikten sonra seçimi sıfırla
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendMessage = async (type: "whatsapp" | "sms") => {
        // Telefon numarasını temizle ve kontrol et
        const cleanPhone = mobil?.replace(/\D/g, '');

        if (!cleanPhone) {
            showCustomNotification(false, type, 'Telefon numarası bulunamadı');
            return;
        }

        if (!content.trim()) {
            showCustomNotification(false, type, 'Mesaj içeriği boş olamaz');
            return;
        }

        setIsSendingMessage(true)

        try {
            console.log('Mesaj gönderiliyor:', { phoneNumber: cleanPhone, message: content, type })

            const response = await axios.post('/api/main/chat-send', {
                phoneNumber: cleanPhone,
                message: content,
                type
            });

            if (response.data.success) {
                let successMessage = '';
                successMessage = `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} mesajınız başarıyla gönderildi.`;

                showCustomNotification(true, type, successMessage);
            } else {
                let errorMessage = '';
                errorMessage = response.data.message || 'Mesaj gönderilemedi';

                showCustomNotification(false, type, errorMessage);
            }
        } catch (error: any) {
            console.error(`${type.toUpperCase()} gönderme hatası:`, error)
            showCustomNotification(false, type, error.response?.data?.message || 'Mesaj gönderilirken bir hata oluştu');
        } finally {
            setIsSendingMessage(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setFiles(prev => [...prev, ...selectedFiles])
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const TicketChat = (mobil: string) => {
        if (!mobil) {
            showCustomNotification(false, 'whatsapp', 'Telefon numarası bulunamadı');
            return;
        }

        // Telefon numarasını temizle ve formatla
        const cleanPhone = mobil.replace(/\+/g, '');

        const tabId = `whatsapp-chat-${cleanPhone}`;
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)

        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: `Sohbet Pencersini Aç ${mobil}`,
                lazyComponent: () => import('@/app/[tenantId]/(main)/tickets/detail/components/ticket-chat').then(module => ({
                    default: (props: any) => <module.default mobil={mobil} {...props} />
                }))
            })
        }
        setActiveTab(tabId)
    }

    const handleQuickResponse = (value: string) => {
        const selectedResponse = value === 'missed_call' ? quickResponses.missed_call : value === 'need_info' ? quickResponses.need_info : quickResponses.future_service;
        let newContent = '';

        // Eğer mevcut içerik varsa ve boş değilse, yeni satırdan sonra ekle
        if (content.trim()) {
            newContent = `${content}\n\n${selectedResponse}`;
        } else {
            // İçerik boşsa, direkt olarak seçilen yanıtı ekle
            newContent = selectedResponse;
        }

        setContent(newContent);

        // İmleci son karaktere konumlandır
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newContent.length, newContent.length);
            }
        }, 0);
    };

    // WhatsApp mesajı içeren herhangi bir yorum var mı kontrol et
    const hasWhatsAppMessage = () => {
        // Mevcut içerikte WhatsApp mesajı var mı?
        // Yorumlarda WhatsApp mesajı var mı?
        return comments.some(comment =>
            comment.content && typeof comment.content === 'string' &&
            comment.content.includes("WhatsApp üzerinden")
        );
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Özel Bildirim Komponenti */}
            {showNotification && notificationData && (
                <div
                    className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out transform ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
                        } ${notificationData.success ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            {notificationData.success ? (
                                <div className="bg-white rounded-full p-1">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                            ) : (
                                <div className="bg-white rounded-full p-1">
                                    <XCircle className="h-6 w-6 text-red-500" />
                                </div>
                            )}
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">
                                {notificationData.success ? 'Başarılı!' : 'Hata!'}
                            </p>
                            <p className="mt-1 text-sm text-white opacity-90">
                                {notificationData.message}
                            </p>
                            <div className="mt-2">
                                <div className="h-1 w-full bg-white bg-opacity-30 rounded-full overflow-hidden">
                                    <div className="h-full bg-white animate-shrink-width" style={{ animationDuration: '5s' }}></div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="ml-4 text-white hover:text-gray-100 focus:outline-none"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder={
                    messageType === "whatsapp"
                        ? "WhatsApp mesajınızı yazın..."
                        : messageType === "sms"
                            ? "SMS mesajınızı yazın..."
                            : "Yanıtınızı yazın..."
                }
                className="min-h-[80px] resize-none text-sm border-gray-200 dark:border-gray-700 rounded-lg focus-visible:ring-blue-500 shadow-sm"
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-8">
                    <RadioGroup
                        value={messageType}
                        onValueChange={(value: "whatsapp" | "sms" | "") => {
                            setMessageType(value);
                            setQuickResponseKey(""); // Reset quick response selection
                        }}
                        className="flex items-center gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="" id="comment" />
                            <label htmlFor="comment" className="text-xs cursor-pointer">
                                Sadece Yorum
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="whatsapp" id="whatsapp" />
                            <label htmlFor="whatsapp" className="flex items-center space-x-1.5 text-xs cursor-pointer">
                                <FaWhatsapp className="text-green-500" />
                                <span>WhatsApp</span>
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sms" id="sms" />
                            <label htmlFor="sms" className="flex items-center space-x-1.5 text-xs cursor-pointer">
                                <Phone className="text-orange-500 h-3 w-3" />
                                <span>SMS</span>
                            </label>
                        </div>
                    </RadioGroup>

                    <div className="flex items-center gap-4">
                        <Select
                            key={messageType} // Force re-render when message type changes
                            value={quickResponseKey}
                            onValueChange={(value: string) => {
                                setQuickResponseKey(value);
                                handleQuickResponse(value);
                            }}
                        >
                            <SelectTrigger className="w-[120px] h-8 text-xs border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
                                <MessageSquare className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                <span className="text-gray-500">Hızlı Yanıt</span>
                            </SelectTrigger>
                            <SelectContent className="w-[400px]">
                                <SelectItem value="missed_call" className="text-xs whitespace-normal py-2">
                                    {quickResponses.missed_call}
                                </SelectItem>
                                <SelectItem value="need_info" className="text-xs whitespace-normal py-2">
                                    {quickResponses.need_info}
                                </SelectItem>
                                <SelectItem value="future_service" className="text-xs whitespace-normal py-2">
                                    {quickResponses.future_service}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="border-l border-gray-200 dark:border-gray-700 h-6 mx-2"></div>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "relative",
                                        !hasWhatsAppMessage() && "cursor-help"
                                    )}>
                                        {!hasWhatsAppMessage() && (
                                            <div className="absolute -right-2 -top-2 z-10 bg-amber-100 dark:bg-amber-900 rounded-full p-0.5">
                                                <Info className="h-3.5 w-3.5 text-amber-500" />
                                            </div>
                                        )}
                                        <Button
                                            onClick={() => TicketChat(mobil)}
                                            variant="outline"
                                            size="sm"
                                            disabled={!hasWhatsAppMessage()}
                                            className={cn(
                                                "h-8 text-xs border-gray-200 dark:border-gray-700 rounded-md shadow-sm flex items-center gap-1.5",
                                                !hasWhatsAppMessage() && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <FaWhatsapp className="text-green-500" />
                                            Sohbet Penceresini Aç
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {!hasWhatsAppMessage() && (
                                    <TooltipContent className="max-w-xs">
                                        <p>Sohbet geçmişi görüntülenemiyor çünkü bu kişiyle WhatsApp üzerinden daha önce bir mesajlaşma başlatılmamış. Lütfen önce 'Yorumlar' bölümünden WhatsApp seçeneğini işaretleyerek ilk mesajı gönderin. Mesaj gönderildikten sonra sohbet ekranı aktif hale gelecektir.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting || isSendingMessage}
                    size="sm"
                    className={cn(
                        "bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded-md text-xs font-medium shadow-sm",
                        (isSubmitting || isSendingMessage) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Send className="h-3 w-3 mr-1.5" />
                    {isSubmitting || isSendingMessage ? "Gönderiliyor..." : "Gönder"}
                </Button>
            </div>

            {files.length > 0 && messageType === "" && (
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