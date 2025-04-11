import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import axiosRaw from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {

    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://support.robotpos.com' : 'http://localhost:3000';
    const basePath = process.env.NEXT_PUBLIC_BASEPATH || '/supportdesk';
    const tokenResponse = await axiosRaw.get(`${baseUrl}${basePath}/api/whatsapp-token`);
    const accessToken = tokenResponse.data.accessToken;
    // ChatApp API'sine istek at
    const response = await axios.get('https://api.chatapp.online/v1/licenses/52504/messengers/caWhatsApp/templates', {
      headers: {
        'Authorization': accessToken,
        'Lang': 'en'
      }
    });

    // API yanıtını al
    const data = response.data;

    // Başarılı yanıt kontrolü
    if (data.success) {
      // Sadece "response" ile başlayan şablonları filtrele
      const filteredTemplates = data.data.items.filter((template: any) => 
        template.elementName && template.elementName.startsWith('response')
      );

      return res.status(200).json({ 
        success: true, 
        data: { 
          items: filteredTemplates 
        } 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'ChatApp API yanıtı başarısız oldu' 
      });
    }
  } catch (error: any) {
    console.error('WhatsApp şablonları alınırken hata:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'WhatsApp şablonları alınırken bir hata oluştu' 
    });
  }
}