import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

/**
 * WhatsApp API'sinden alınan token verilerinin yapısı
 */
interface TokenData {
  cabinetUserId: number
  accessToken: string
  accessTokenEndTime: number
  refreshToken: string
  refreshTokenEndTime: number
}

/**
 * WhatsApp API yanıt formatı
 */
interface ApiResponse {
  success: boolean
  data: TokenData
}

/**
 * Token yanıt yapısı
 */
interface TokenResponse {
  accessToken: string
  isExpired?: boolean
  isFallback?: boolean
}

// Global değişken olarak token önbelleğini tanımla
// @ts-ignore
global.whatsappTokenCache = global.whatsappTokenCache || {
  tokenData: null as TokenData | null,
  lastErrorTime: 0,
  consecutiveErrorCount: 0
};

// Yapılandırma sabitleri
const MAX_RETRY_ATTEMPTS = 3;
const RATE_LIMIT_COOLDOWN_MS = 300000; // 5 dakika
const TOKEN_REFRESH_BUFFER_SEC = 300; // Token süresinin dolmasına 5 dakika kala yenile
const FALLBACK_TOKEN = process.env.WHATSAPP_FALLBACK_TOKEN || '';

/**
 * WhatsApp token API'sine istek gönderip yeni token alır
 * 
 * @returns {Promise<TokenData>} Token verileri
 * @throws {Error} API hatası durumunda
 */
async function fetchNewToken(): Promise<TokenData> {
  console.log('Yeni WhatsApp token\'ı talep ediliyor...');
  
  try {
    const response = await axios.post<ApiResponse>('https://api.chatapp.online/v1/tokens', {
      email: process.env.CHATAPP_EMAIL,
      password: process.env.CHATAPP_PASSWORD,
      appId: process.env.CHATAPP_APPID
    }, {
      headers: {
        'Lang': 'en',
        'Content-Type': 'application/json'
      }
    });

    console.log('API yanıt durumu:', response.status);
    
    if (!response.data.success || !response.data.data) {
      console.error('Token API hata yanıtı:', response.data);
      throw new Error('Token alınamadı: API başarısız yanıt döndü');
    }

    // Hata sayacını sıfırla
    // @ts-ignore
    global.whatsappTokenCache.consecutiveErrorCount = 0;
    // @ts-ignore
    global.whatsappTokenCache.lastErrorTime = 0;
    
    const newToken: TokenData = response.data.data;
    console.log('Yeni token alındı, geçerlilik süresi:', new Date(newToken.accessTokenEndTime * 1000).toISOString());
    
    return newToken;
  } catch (error) {
    // Hata sayacını artır
    // @ts-ignore
    global.whatsappTokenCache.consecutiveErrorCount++;
    // @ts-ignore
    global.whatsappTokenCache.lastErrorTime = Date.now();
    
    if (axios.isAxiosError(error)) {
      console.error('Token API hatası:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // 429 hatası özel olarak işaretlenir
      if (error.response?.status === 429) {
        // @ts-ignore
        console.log(`Rate limit aşıldı (${global.whatsappTokenCache.consecutiveErrorCount}. hata)`);
      }
    } else {
      console.error('Token alınırken beklenmeyen hata:', error);
    }
    
    throw error;
  }
}

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 * 
 * @param {TokenData} token Kontrol edilecek token
 * @returns {boolean} Token geçerliyse true, değilse false
 */
function isTokenValid(token: TokenData | null): boolean {
  if (!token) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  // Token süresi dolmamışsa geçerli kabul et
  return token.accessTokenEndTime > currentTime;
}

/**
 * Token'ın yakında sona erip ermeyeceğini kontrol eder
 * 
 * @param {TokenData} token Kontrol edilecek token
 * @returns {boolean} Token yakında sona erecekse true, değilse false
 */
function isTokenExpiringSoon(token: TokenData | null): boolean {
  if (!token) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  // Token süresi dolmasına buffer süresi kadar kaldıysa yakında sona erecek kabul et
  return token.accessTokenEndTime - currentTime < TOKEN_REFRESH_BUFFER_SEC;
}

/**
 * Rate limit nedeniyle bekleme modunda olup olmadığını kontrol eder
 * 
 * @returns {boolean} Rate limit bekleme modundaysa true, değilse false
 */
function isInRateLimitCooldown(): boolean {
  // @ts-ignore
  if (global.whatsappTokenCache.lastErrorTime === 0) return false;
  
  // @ts-ignore
  const timeSinceLastError = Date.now() - global.whatsappTokenCache.lastErrorTime;
  return timeSinceLastError < RATE_LIMIT_COOLDOWN_MS;
}

/**
 * WhatsApp token API handler
 * 
 * Bu API endpoint'i WhatsApp entegrasyonu için gerekli token'ı sağlar.
 * Token önbellekte tutulur ve süresi dolduğunda otomatik olarak yenilenir.
 * Rate limit aşıldığında akıllı bir yeniden deneme stratejisi uygular.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse | { message: string }>
) {
  console.log('WhatsApp token handler çağrıldı:', new Date().toISOString());
  
  if (req.method !== 'GET') {
    console.log('İzin verilmeyen metod:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Token durumunu kontrol et
    const currentTime = Math.floor(Date.now() / 1000);
    // @ts-ignore
    const tokenCache = global.whatsappTokenCache.tokenData;
    console.log('Token önbellek durumu:', tokenCache ? 'mevcut' : 'boş');
    
    if (tokenCache) {
      console.log('Token geçerlilik süresi:', new Date(tokenCache.accessTokenEndTime * 1000).toISOString());
      console.log('Token kalan süre:', tokenCache.accessTokenEndTime - currentTime, 'saniye');
    }
    
    // 1. Durum: Token geçerliyse ve yakında sona ermeyecekse, mevcut token'ı kullan
    if (isTokenValid(tokenCache) && !isTokenExpiringSoon(tokenCache)) {
      console.log('Önbellekteki geçerli token kullanılıyor');
      // tokenCache null olamaz çünkü isTokenValid true döndüyse token var demektir
      return res.status(200).json({ accessToken: tokenCache!.accessToken });
    }
    
    // 2. Durum: Rate limit cooldown süresi içindeyse ve token varsa (süresi geçmiş olsa bile) kullan
    if (isInRateLimitCooldown() && tokenCache) {
      // @ts-ignore
      console.log(`Rate limit cooldown aktif (${Math.round((RATE_LIMIT_COOLDOWN_MS - (Date.now() - global.whatsappTokenCache.lastErrorTime)) / 1000)} saniye kaldı), süresi geçmiş token kullanılıyor`);
      return res.status(200).json({ 
        accessToken: tokenCache.accessToken,
        isExpired: true
      });
    }
    
    // 3. Durum: Token geçersiz veya yakında sona erecek, yeni token almayı dene
    try {
      // Yeni token al
      const newToken = await fetchNewToken();
      // @ts-ignore
      global.whatsappTokenCache.tokenData = newToken;
      return res.status(200).json({ accessToken: newToken.accessToken });
    } catch (error) {
      // 4. Durum: Yeni token alınamadı ama önbellekte eski token var
      if (tokenCache) {
        console.log('Yeni token alınamadı, süresi geçmiş token kullanılıyor');
        return res.status(200).json({ 
          accessToken: tokenCache.accessToken,
          isExpired: true
        });
      }
      
      // 5. Durum: Hiç token yok ve fallback token tanımlanmış
      if (FALLBACK_TOKEN) {
        console.log('Token yok, fallback token kullanılıyor');
        return res.status(200).json({ 
          accessToken: FALLBACK_TOKEN,
          isFallback: true
        });
      }
      
      // 6. Durum: Hiçbir token yok ve alınamıyor
      throw new Error('Token alınamadı ve fallback token yok');
    }
  } catch (error) {
    console.error('WhatsApp token handler hatası:', error);
    return res.status(500).json({ message: 'Token alınamadı' });
  }
}
