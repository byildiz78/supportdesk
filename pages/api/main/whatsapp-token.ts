import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

interface TokenData {
  cabinetUserId: number
  accessToken: string
  accessTokenEndTime: number
  refreshToken: string
  refreshTokenEndTime: number
}

// Global değişken olarak token önbelleğini tanımla
// @ts-ignore
global.whatsappTokenCache = global.whatsappTokenCache || {
  tokenData: null as TokenData | null,
  lastErrorTime: 0,
  consecutiveErrorCount: 0
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Token geçerli mi kontrol et
    const currentTime = Math.floor(Date.now() / 1000)
    // @ts-ignore
    const tokenCache = global.whatsappTokenCache.tokenData;
    
    if (tokenCache && tokenCache.accessTokenEndTime > currentTime) {
      console.log('Önbellekteki geçerli token kullanılıyor');
      return res.status(200).json({ accessToken: tokenCache.accessToken })
    }

    // Token yoksa veya süresi geçmişse yeni token al
    const response = await axios.post('https://api.chatapp.online/v1/tokens', {
      email: process.env.CHATAPP_EMAIL,
      password: process.env.CHATAPP_PASSWORD,
      appId: 'app_50598_1'
    }, {
      headers: {
        'Lang': 'en',
        'Content-Type': 'application/json'
      }
    })

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get token')
    }

    const newToken: TokenData = response.data.data
    // @ts-ignore
    global.whatsappTokenCache.tokenData = newToken;
    console.log('Yeni token alındı, geçerlilik süresi:', new Date(newToken.accessTokenEndTime * 1000).toISOString());
    return res.status(200).json({ accessToken: newToken.accessToken })

  } catch (error) {
    console.error('WhatsApp token error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
