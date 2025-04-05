import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

interface TokenData {
  cabinetUserId: number
  accessToken: string
  accessTokenEndTime: number
  refreshToken: string
  refreshTokenEndTime: number
}

let tokenCache: TokenData | null = null

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
    if (tokenCache && tokenCache.accessTokenEndTime > currentTime) {
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
    tokenCache = newToken
    return res.status(200).json({ accessToken: newToken.accessToken })

  } catch (error) {
    console.error('WhatsApp token error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
