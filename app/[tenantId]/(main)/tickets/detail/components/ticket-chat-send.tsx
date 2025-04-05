import React, { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger, getTabIcon } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare, MessageCircle, Phone, CheckCircle2, XCircle } from 'lucide-react'
import axios from '@/lib/axios'
import { toast } from '@/hooks/use-toast'
import { useTabStore } from '@/stores/tab-store'
import { FaWhatsapp } from 'react-icons/fa'

interface TicketChatSendProps {
    mobil: string | null | undefined;
    ticketNo?: string;
    customerName?: string;
}

const TicketChatSend = ({ mobil, ticketNo, customerName }: TicketChatSendProps) => {
    const [smsMessage, setSmsMessage] = useState('')
    const [whatsappMessage, setWhatsappMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const defaultMessagePrefix = useRef<string>('')
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const [showNotification, setShowNotification] = useState(false)
    const [notificationData, setNotificationData] = useState<{
        success: boolean;
        type: 'sms' | 'whatsapp';
        message: string;
    } | null>(null)

    // Şablon mesajları oluştur
    useEffect(() => {
        // Şablon ön metnini oluştur
        const ticketInfo = ticketNo ? `#${ticketNo}` : '';
        
        // Ortak şablon ön metni
        defaultMessagePrefix.current = `${ticketInfo} destek talebiniz hk. bilgilendirme: `;
        
        // Her iki mesaj tipine de aynı şablonu uygula
        setSmsMessage(defaultMessagePrefix.current);
        setWhatsappMessage(defaultMessagePrefix.current);
        
    }, [ticketNo, customerName]);

    // Mesaj değiştiğinde ön eki koru
    const handleMessageChange = (value: string, type: 'sms' | 'whatsapp') => {
        const prefix = defaultMessagePrefix.current;
        
        // Eğer kullanıcı ön eki silmeye çalışıyorsa, izin verme
        if (!value.startsWith(prefix)) {
            if (type === 'sms') {
                setSmsMessage(prefix + value.substring(Math.min(value.length, prefix.length)));
            } else {
                setWhatsappMessage(prefix + value.substring(Math.min(value.length, prefix.length)));
            }
            return;
        }
        
        // Normal değişiklik
        if (type === 'sms') {
            setSmsMessage(value);
        } else {
            setWhatsappMessage(value);
        }
    };

    // Bildirim gösterme ve otomatik kapatma
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showNotification) {
            timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000); // 5 saniye sonra kapat
        }
        return () => clearTimeout(timer);
    }, [showNotification]);

    const handleSendMessage = async (type: 'sms' | 'whatsapp') => {
        if (!mobil) {
            toast({
                title: 'Hata',
                description: 'Telefon numarası bulunamadı',
                variant: 'destructive'
            })
            return
        }

        const message = type === 'sms' ? smsMessage : whatsappMessage

        if (!message.trim()) {
            toast({
                title: 'Hata',
                description: 'Mesaj içeriği boş olamaz',
                variant: 'destructive'
            })
            return
        }

        setIsSending(true)

        try {
            console.log('Mesaj gönderiliyor:', { phoneNumber: mobil, message, type })

            // Telefon numarası kontrolü
            if (!mobil) {
                toast({
                    title: 'Hata',
                    description: 'Telefon numarası bulunamadı',
                    variant: 'destructive'
                })
                setIsSending(false);
                return;
            }

            const response = await axios.post('/api/main/chat-send', {
                phoneNumber: mobil,
                message,
                type
            });

            if (response.data.success) {
                // Başarılı mesaj gönderimi için özel bildirim
                setNotificationData({
                    success: true,
                    type: type,
                    message: `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} mesajınız başarıyla gönderildi.`
                });
                setShowNotification(true);
                
                // Mesaj gönderildikten sonra input alanını temizle ve varsayılan değeri yeniden ayarla
                if (type === 'sms') {
                    setSmsMessage(defaultMessagePrefix.current)
                } else {
                    setWhatsappMessage(defaultMessagePrefix.current)
                }
            } else {
                // Hata bildirimi
                setNotificationData({
                    success: false,
                    type: type,
                    message: response.data.message || 'Mesaj gönderilemedi'
                });
                setShowNotification(true);
            }
        } catch (error: any) {
            console.error(`${type.toUpperCase()} gönderme hatası:`, error)
            // Hata bildirimi
            setNotificationData({
                success: false,
                type: type,
                message: error.response?.data?.message || 'Mesaj gönderilirken bir hata oluştu'
            });
            setShowNotification(true);
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="w-full relative">
            {/* Özel Bildirim Komponenti */}
            {showNotification && notificationData && (
                <div 
                    className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out transform ${
                        showNotification ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
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

            <Tabs defaultValue="whatsapp" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="whatsapp">
                        WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="sms">
                        SMS
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="whatsapp-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                WhatsApp Mesajı
                            </label>
                            <textarea
                                id="whatsapp-message"
                                value={whatsappMessage}
                                onChange={(e) => handleMessageChange(e.target.value, 'whatsapp')}
                                placeholder="WhatsApp mesajınızı yazın..."
                                className="min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>

                        <Button
                            onClick={() => handleSendMessage('whatsapp')}
                            disabled={isSending || !whatsappMessage.trim() || !mobil}
                            className="w-full"
                        >
                            {isSending ? 'Gönderiliyor...' : 'WhatsApp Mesajı Gönder'}
                        </Button>

                        {!mobil && (
                            <p className="text-sm text-red-500">Telefon numarası bulunamadı</p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="sms" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="sms-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                SMS Mesajı
                            </label>
                            <textarea
                                id="sms-message"
                                value={smsMessage}
                                onChange={(e) => handleMessageChange(e.target.value, 'sms')}
                                placeholder="SMS mesajınızı yazın..."
                                className="min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>

                        <Button
                            onClick={() => handleSendMessage('sms')}
                            disabled={isSending || !smsMessage.trim() || !mobil}
                            className="w-full"
                        >
                            {isSending ? 'Gönderiliyor...' : 'SMS Mesajı Gönder'}
                        </Button>

                        {!mobil && (
                            <p className="text-sm text-red-500">Telefon numarası bulunamadı</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default TicketChatSend