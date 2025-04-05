import { NextApiRequest, NextApiResponse } from 'next';
import axios from '@/lib/axios';
import { db } from '@/lib/database';

// Mesaj gönderme API'si
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { phoneNumber, message, type = 'both' } = req.body;

        console.log('API isteği alındı:', req.body);

        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'Telefon numarası gereklidir' });
        }

        if (!message) {
            return res.status(400).json({ success: false, message: 'Mesaj içeriği gereklidir' });
        }

        const results = {
            sms: { success: false, data: null as any, error: null as string | null },
            whatsapp: { success: false, data: null as any, error: null as string | null }
        };

        // SMS gönderimi
        if (type === 'sms' || type === 'both') {
            try {
                // Telefon numarasını formatlama (SMS için)
                let formattedPhone = phoneNumber;
                
                // +90 ile başlıyorsa kaldır
                formattedPhone = phoneNumber.replace(/^\+90/, '');
                // 90 ile başlıyorsa kaldır
                formattedPhone = formattedPhone.replace(/^90/, '');
                // Boşluk, tire gibi karakterleri kaldır
                formattedPhone = formattedPhone.replace(/[\s-]/g, '');

                if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
                    formattedPhone = formattedPhone.substring(1);
                }

                if (formattedPhone.length !== 10) {
                    results.sms.error = `Geçersiz telefon numarası formatı: ${phoneNumber}, formatlanmış: ${formattedPhone}`;
                } else {
                    console.log('SMS gönderiliyor:', {
                        formattedPhone,
                        message
                    });
                    
                    const response = await axios({
                        method: 'post',
                        url: 'https://api.netgsm.com.tr/sms/rest/v2/send',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic MjE2NjA2NzAyNjpNYW50YXIzXw=='
                        },
                        data: {
                            msgheader: "RobotPOS",
                            startdate: "",
                            stopdate: "",
                            appname: "robotPOS",
                            iysfilter: "0",
                            encoding: "TR",
                            messages: [
                                {
                                    msg: message,
                                    no: formattedPhone
                                }
                            ]
                        }
                    });

                    console.log('SMS gönderildi:', response.data);
                    results.sms = { success: true, data: response.data, error: null };
                }
            } catch (error: any) {
                console.error('SMS gönderme hatası:', error);
                results.sms = { success: false, data: null, error: error.message || 'SMS gönderilirken bir hata oluştu' };
            }
        }

        // WhatsApp gönderimi
        if (type === 'whatsapp' || type === 'both') {
            try {
                // WhatsApp için telefon numarası formatını düzenle
                // WhatsApp API'si 90XXXXXXXXXX formatını bekliyor
                let whatsappPhone = phoneNumber;
                
                // +90 ile başlıyorsa + işaretini kaldır
                whatsappPhone = whatsappPhone.replace(/^\+/, '');
                
                // 90 ile başlamıyorsa ekle
                if (!whatsappPhone.startsWith('90')) {
                    whatsappPhone = '90' + whatsappPhone;
                }
                
                // Boşluk, tire gibi karakterleri kaldır
                whatsappPhone = whatsappPhone.replace(/[\s-]/g, '');
                
                console.log('WhatsApp mesajı gönderiliyor:', {
                    originalPhone: phoneNumber,
                    formattedPhone: whatsappPhone,
                    message
                });
                
                // WhatsApp mesajı gönder
                const response = await axios({
                    method: 'post',
                    url: 'https://support.robotpos.com/whatsapp/api/venom/sendmessage',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        phoneNumber: whatsappPhone,
                        message
                    }
                });

                console.log('WhatsApp mesajı gönderildi:', response.data);
                results.whatsapp = { success: true, data: response.data, error: null };
            } catch (error: any) {
                console.error('WhatsApp gönderme hatası:', error);
                results.whatsapp = { success: false, data: null, error: error.message || 'WhatsApp mesajı gönderilirken bir hata oluştu' };
            }
        }

        // Sonuçları değerlendir
        const allSuccess = (type === 'both' && results.sms.success && results.whatsapp.success) || 
                          (type === 'sms' && results.sms.success) || 
                          (type === 'whatsapp' && results.whatsapp.success);
        
        if (allSuccess) {
            return res.status(200).json({
                success: true,
                message: type === 'both' 
                    ? 'SMS ve WhatsApp mesajları başarıyla gönderildi' 
                    : `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} mesajı başarıyla gönderildi`,
                data: results
            });
        } else {
            let errorMessage = '';
            if (type === 'both') {
                if (!results.sms.success && !results.whatsapp.success) {
                    errorMessage = 'SMS ve WhatsApp mesajları gönderilemedi';
                } else if (!results.sms.success) {
                    errorMessage = 'SMS mesajı gönderilemedi, ancak WhatsApp mesajı gönderildi';
                } else {
                    errorMessage = 'WhatsApp mesajı gönderilemedi, ancak SMS mesajı gönderildi';
                }
            } else {
                errorMessage = `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} mesajı gönderilemedi`;
            }
            
            return res.status(207).json({
                success: false,
                message: errorMessage,
                data: results
            });
        }
    } catch (error: any) {
        console.error(`Mesaj gönderme hatası:`, error);

        return res.status(500).json({
            success: false,
            message: 'Mesaj gönderilirken bir hata oluştu',
            error: error.message || 'Bilinmeyen hata'
        });
    }
}