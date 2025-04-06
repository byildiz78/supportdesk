import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

interface ApiResponse {
    success: boolean;
    data: {
        nextPage: string | null;
        items: any[];
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ success: boolean; data?: any; message?: string }>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Telefon numarası gerekli' });
    }

    try {
        // Önce token al
        const baseUrl = process.env.NODE_ENV === 'production' ? 'https://support.robotpos.com' : 'http://localhost:3000';
        const basePath = process.env.NEXT_PUBLIC_BASEPATH || '/supportdesk';
        const tokenResponse = await axios.get<{ accessToken: string }>(`${baseUrl}${basePath}/api/whatsapp-token`);
        const accessToken = tokenResponse.data.accessToken;

        // Telefon numarasını formatlayarak API'ye uygun hale getir
        let formattedPhone = String(phoneNumber).replace(/\D/g, '');

        // Başında 90 yoksa ekle
        if (!formattedPhone.startsWith('90')) {
            formattedPhone = '90' + formattedPhone;
        }

        // ChatApp API'sine istek at
        const chatResponse = await axios.get<ApiResponse>(
            `https://api.chatapp.online/v1/licenses/52504/messengers/grWhatsApp/chats/${formattedPhone}@c.us/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Mesaj geçmişi var mı kontrol et
        const hasChatHistory = chatResponse.data.success && chatResponse.data.data.items.length > 0;

        return res.status(200).json({
            success: true,
            data: {
                hasChatHistory,
                messages: chatResponse.data.data.items
            }
        });
    } catch (error) {
        console.error('ChatApp API hatası:', error);
        return res.status(500).json({ success: false, message: 'ChatApp API ile iletişim sırasında bir hata oluştu' });
    }
}