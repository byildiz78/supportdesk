import { formatDateTimeYMDHIS } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import axios from 'axios';
import { ChatBot } from './analyser_menu_items';

// OpenRouter API anahtarı
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// AI modelleri (tek yerden yönetim için)
const AI_MODELS = {
    PRIMARY: process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-4o-mini",
    FALLBACK: process.env.OPENROUTER_FALLBACK_MODEL || "openai/gpt-4o"
};

type ResponseWithFlush = NextApiResponse & {
    flush?: () => void;
};

export default async function handler(
    req: NextApiRequest,
    res: ResponseWithFlush
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Bu metod desteklenmiyor' });
    }

    try {
        const { ChatBotID, branches, date1, date2 } = req.body;

        if (!ChatBotID) {
            return res.status(400).json({ error: 'ChatBotID gereklidir' });
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send progress update
        res.write('data: ' + JSON.stringify({ status: 'progress', message: 'Yapılandırma alınıyor...' }) + '\n\n');
        res.flush?.();

        const query = `SELECT "ChatbotQuery", "ChatbotRole", "ChatbotContent", "ChatbotQueryParams" 
                        FROM "dm_chatbot" 
                        WHERE "ChatBotID" = $1 
                        LIMIT 1;`;
        const config = await db.executeQuery<ChatBot[]>({
            query,
            params: [ChatBotID],
            req
        });

        const chatbotConfig = config[0];

        if (!chatbotConfig) {
            res.write('data: ' + JSON.stringify({
                status: 'error',
                error: 'Chatbot yapılandırması bulunamadı'
            }) + '\n\n');
            res.flush?.();
            return res.end();
        }

        const date1Obj = new Date(date1);
        const date2Obj = new Date(date2);

        // PostgreSQL her zaman dizi tipinde parametre bekler
        const parameters = [
            formatDateTimeYMDHIS(date1Obj),  // $1 - başlangıç tarihi
            formatDateTimeYMDHIS(date2Obj)   // $2 - bitiş tarihi
        ];
        
        // Eğer ek parametreler varsa ve bir dizi ise, bunları ekle
        const additionalParams = chatbotConfig.ChatbotQueryParams ? JSON.parse(chatbotConfig.ChatbotQueryParams) : null;
        if (additionalParams && Array.isArray(additionalParams)) {
            parameters.push(...additionalParams);
        }

        res.write('data: ' + JSON.stringify({ status: 'progress', message: 'Veriler alınıyor...' }) + '\n\n');
        res.flush?.();

        const queryResult = await db.executeQuery<any[]>({
            query: chatbotConfig.ChatbotQuery,
            params: parameters,
            req
        }).catch(error => {
            console.error('Sorgu çalıştırma hatası:', error);
            throw new Error('Analiz sorgusu çalıştırılamadı');
        });

        try {
            if (queryResult.length) {
                const dataSummary = {
                    totalRecords: queryResult.length,
                    data: queryResult
                };

                // Veri boyutu ve parçalama stratejisi
                const CHUNK_SIZE = 50; // Her bir parçada kaç kayıt olacak
                const TOTAL_RECORDS = queryResult.length;
                
                // Veri çok büyükse parçalara ayır
                if (TOTAL_RECORDS > CHUNK_SIZE) {
                    res.write('data: ' + JSON.stringify({
                        status: 'progress',
                        message: `Veri boyutu büyük (${TOTAL_RECORDS} kayıt). Analiz parça parça yapılacak...`
                    }) + '\n\n');
                    res.flush?.();
                    
                    // Veriyi parçalara ayır
                    const chunks = [];
                    for (let i = 0; i < TOTAL_RECORDS; i += CHUNK_SIZE) {
                        chunks.push(queryResult.slice(i, i + CHUNK_SIZE));
                    }
                    
                    let analysisResults = '';
                    
                    // Her bir parçayı ayrı ayrı analiz et
                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        
                        res.write('data: ' + JSON.stringify({
                            status: 'progress',
                            message: `Parça ${i+1}/${chunks.length} analiz ediliyor (${chunk.length} kayıt)...`
                        }) + '\n\n');
                        res.flush?.();
                        
                        // Parça için prompt oluştur
                        const chunkPrompt = `
                            ${chatbotConfig.ChatbotContent}
                            
                            NOT: Bu, toplam ${TOTAL_RECORDS} kayıtlık verinin ${i+1}. parçasıdır (${chunk.length} kayıt). 
                            Sadece bu parçadaki verileri analiz edin. Diğer parçalar ayrıca analiz edilecektir.
                            
                            Analiz edilecek veri parçası (${i+1}/${chunks.length}):
                            ${JSON.stringify(chunk, null, 2)}
                        `;
                        
                        try {
                            // Bu parçayı analiz et
                            const chunkResult = await analyzeDataChunk(chunkPrompt, res);
                            
                            // Sonucu ana sonuca ekle
                            analysisResults += `\n\n## Parça ${i+1} Analiz Sonuçları\n\n${chunkResult}`;
                            
                        } catch (chunkError) {
                            console.error(`Parça ${i+1} analiz hatası:`, chunkError);
                            res.write('data: ' + JSON.stringify({
                                status: 'progress',
                                message: `Parça ${i+1} analizi sırasında hata oluştu, devam ediliyor...`
                            }) + '\n\n');
                            res.flush?.();
                        }
                    }
                    
                    // Tüm parça sonuçlarını birleştiren bir özet iste
                    res.write('data: ' + JSON.stringify({
                        status: 'progress',
                        message: `Tüm parçalar analiz edildi. Genel özet oluşturuluyor...`
                    }) + '\n\n');
                    res.flush?.();
                    
                    const summaryPrompt = `
                        ${chatbotConfig.ChatbotContent}
                        
                        Aşağıda ${chunks.length} parçaya bölünmüş veri analizinin sonuçları bulunmaktadır.
                        Lütfen bu sonuçları birleştirerek genel bir özet oluşturun. Tekrar eden bilgileri birleştirin
                        ve tutarsızlıkları giderin. Sonuçları bir bütün halinde sunun.
                        
                        Parça analiz sonuçları:
                        ${analysisResults}
                    `;
                    
                    try {
                        // Genel özeti oluştur
                        await analyzeDataChunk(summaryPrompt, res, true);
                        
                        res.write('data: ' + JSON.stringify({
                            status: 'complete',
                            message: 'Analiz tamamlandı'
                        }) + '\n\n');
                        res.flush?.();
                        res.end();
                        
                    } catch (summaryError) {
                        console.error('Özet oluşturma hatası:', summaryError);
                        res.write('data: ' + JSON.stringify({
                            status: 'error',
                            error: 'Özet oluşturulurken bir hata oluştu'
                        }) + '\n\n');
                        res.flush?.();
                        res.end();
                    }
                    
                } else {
                    // Veri küçükse tek seferde analiz et
                    const prompt = `
                        ${chatbotConfig.ChatbotContent}
                        
                        Analiz edilecek veri:
                        ${JSON.stringify(queryResult, null, 2)}
                    `;
                    
                    try {
                        // Veriyi analiz et
                        await analyzeDataChunk(prompt, res, true);
                        
                        res.write('data: ' + JSON.stringify({
                            status: 'complete',
                            message: 'Analiz tamamlandı'
                        }) + '\n\n');
                        res.flush?.();
                        res.end();
                        
                    } catch (error) {
                        throw error;
                    }
                }
            } else {
                res.write('data: ' + JSON.stringify({
                    status: 'complete',
                    content: 'Seçmiş Olduğunuz Filtrelere Ait Veri Bulunamadı.'
                }) + '\n\n');
                res.flush?.();
                res.end();
            }

        } catch (error) {
            console.error('AI işleme hatası:', error);
            res.write('data: ' + JSON.stringify({
                status: 'error',
                error: 'İsteğiniz işlenirken bir hata oluştu. Lütfen tekrar deneyin.'
            }) + '\n\n');
            res.flush?.();
            res.end();
        }

    } catch (error) {
        console.error('Handler hatası:', error);
        if (!res.headersSent) {
            res.write('data: ' + JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu'
            }) + '\n\n');
            res.flush?.();
            res.end();
        }
    }
}

// Yardımcı fonksiyon: Veri parçasını analiz et
async function analyzeDataChunk(prompt: string, res: ResponseWithFlush, isFinalChunk: boolean = false): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            // OpenRouter'a istek gönderen yardımcı fonksiyon
            const processOpenRouterRequest = async (content: string, modelName = AI_MODELS.PRIMARY) => {
                try {
                    console.log(`Using ${modelName} for data analysis...`);

                    // Non-streaming request for large data analysis
                    const response = await axios.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        {
                            model: modelName,
                            messages: [
                                {
                                    role: "user",
                                    content: content
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 2000,
                            stream: true
                        },
                        {
                            headers: {
                                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                                "HTTP-Referer": "https://yourapp.com", // Uygulamanızın URL'si
                                "X-Title": "Data Analysis App", // Uygulamanızın adı
                                "Content-Type": "application/json"
                            },
                            responseType: 'stream'
                        }
                    );

                    return response;
                } catch (error) {
                    console.error(`Error with ${modelName}:`, error);
                    throw error;
                }
            };

            let fullContent = '';
            
            // İçerik biriktirme değişkenleri
            let contentBuffer = '';
            const BUFFER_FLUSH_SIZE = 500; // Kaç karakterde bir içeriği göndereceğiz
            const BUFFER_FLUSH_INTERVAL = 1000; // Milisaniye cinsinden içerik gönderme aralığı
            let lastFlushTime = Date.now();
            
            // Biriktirilen içeriği gönderen yardımcı fonksiyon
            const flushContentBuffer = () => {
                if (contentBuffer.trim()) {
                    res.write('data: ' + JSON.stringify({
                        status: 'progress',
                        content: contentBuffer
                    }, (key, value) => {
                        // İçeriği korumak için özel işleme
                        if (key === 'content' && typeof value === 'string') {
                            return value;
                        }
                        return value;
                    }) + '\n\n');
                    res.flush?.();
                    contentBuffer = '';
                    lastFlushTime = Date.now();
                }
            };
            
            // İlk modeli deneyin
            try {
                const stream = await processOpenRouterRequest(prompt, AI_MODELS.PRIMARY);
                
                // Stream yanıtı işle
                stream.data.on('data', (chunk) => {
                    try {
                        // Chunk'ı işle - her chunk birden fazla yanıt içerebilir
                        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;

                            const jsonData = line.substring(6); // "data: " kısmını kaldır
                            if (jsonData === '[DONE]') return;

                            try {
                                const parsed = JSON.parse(jsonData);
                                
                                // Hata kontrolü - API hata döndürdüyse
                                if (parsed.error) {
                                    console.error('OpenAI API error:', parsed.error);
                                    res.write('data: ' + JSON.stringify({
                                        status: 'error',
                                        error: `API Hatası: ${parsed.error.message || 'Bilinmeyen hata'}`
                                    }) + '\n\n');
                                    res.flush?.();
                                    reject(new Error(parsed.error.message || 'API hatası'));
                                    return;
                                }
                                
                                // choices dizisi var mı kontrol et
                                const content = parsed.choices && parsed.choices[0]?.delta?.content || '';
                                
                                // Tam içeriği biriktir
                                fullContent += content;

                                if (content.trim()) {
                                    // Apply the same preservation of newlines and special characters
                                    let processedContent = content;

                                    // Tablo içeriği tespit edildiğinde loglama yap ve basit düzeltmeler yap
                                    if (processedContent.includes('|')) {
                                        // Tablo formatını kontrol et
                                        const lines = processedContent.split('\n');
                                        const tableLines = lines.filter(line =>
                                            line.trim().startsWith('|') && line.trim().endsWith('|')
                                        );

                                        if (tableLines.length > 0) {
                                            // Tablo satırlarının başında ve sonunda boşluk olup olmadığını kontrol et
                                            // Eğer yoksa, ekle
                                            for (let i = 0; i < lines.length; i++) {
                                                const line = lines[i];
                                                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                                                    // Tablo satırının öncesinde ve sonrasında boş satır olup olmadığını kontrol et
                                                    const prevLine = i > 0 ? lines[i - 1] : '';
                                                    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

                                                    // Eğer öncesinde başlık varsa ve boş satır yoksa, boş satır ekle
                                                    if (prevLine.trim().startsWith('#') && !prevLine.trim().endsWith('\n\n')) {
                                                        processedContent = processedContent.replace(
                                                            prevLine + '\n' + line,
                                                            prevLine + '\n\n' + line
                                                        );
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // İçeriği biriktir
                                    contentBuffer += processedContent;
                                    
                                    // Belirli koşullarda içeriği gönder:
                                    // 1. Buffer belirli bir boyuta ulaştığında
                                    // 2. Son gönderimden beri belirli bir süre geçtiyse
                                    // 3. İçerik bir paragraf veya başlık bitimini içeriyorsa
                                    const currentTime = Date.now();
                                    const timeElapsed = currentTime - lastFlushTime;
                                    const containsCompleteParagraph = contentBuffer.includes('\n\n') || 
                                                                     contentBuffer.includes('.\n') ||
                                                                     contentBuffer.includes(':\n');
                                    
                                    if (contentBuffer.length >= BUFFER_FLUSH_SIZE || 
                                        timeElapsed >= BUFFER_FLUSH_INTERVAL ||
                                        containsCompleteParagraph ||
                                        isFinalChunk) {
                                        flushContentBuffer();
                                    }
                                }
                            } catch (parseError) {
                                console.error('JSON parse error:', parseError, jsonData);
                            }
                        }
                    } catch (chunkError) {
                        console.error('Chunk processing error:', chunkError);
                    }
                });

                stream.data.on('end', () => {
                    // Son kalan içeriği gönder
                    flushContentBuffer();
                    resolve(fullContent);
                });

                stream.data.on('error', (streamError) => {
                    console.error('Stream error:', streamError);
                    // Son kalan içeriği gönder
                    flushContentBuffer();
                    reject(streamError);
                });
                
            } catch (primaryError) {
                console.error('Primary model failed:', primaryError);
                
                // Hata durumunda yedek modeli deneyin
                try {
                    console.log(`Trying fallback model ${AI_MODELS.FALLBACK}...`);
                    
                    const fallbackStream = await processOpenRouterRequest(prompt, AI_MODELS.FALLBACK);
                    let fallbackContent = '';
                    
                    // Yedek model için içerik biriktirme değişkenleri
                    let fallbackContentBuffer = '';
                    let fallbackLastFlushTime = Date.now();
                    
                    // Biriktirilen içeriği gönderen yardımcı fonksiyon (yedek model için)
                    const flushFallbackContentBuffer = () => {
                        if (fallbackContentBuffer.trim()) {
                            res.write('data: ' + JSON.stringify({
                                status: 'progress',
                                content: fallbackContentBuffer
                            }, (key, value) => {
                                // İçeriği korumak için özel işleme
                                if (key === 'content' && typeof value === 'string') {
                                    return value;
                                }
                                return value;
                            }) + '\n\n');
                            res.flush?.();
                            fallbackContentBuffer = '';
                            fallbackLastFlushTime = Date.now();
                        }
                    };
                    
                    // Stream yanıtı işle
                    fallbackStream.data.on('data', (chunk) => {
                        try {
                            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                            for (const line of lines) {
                                if (!line.startsWith('data: ')) continue;

                                const jsonData = line.substring(6);
                                if (jsonData === '[DONE]') return;

                                try {
                                    const parsed = JSON.parse(jsonData);
                                    
                                    // Hata kontrolü - API hata döndürdüyse
                                    if (parsed.error) {
                                        console.error('OpenAI API error:', parsed.error);
                                        res.write('data: ' + JSON.stringify({
                                            status: 'error',
                                            error: `API Hatası: ${parsed.error.message || 'Bilinmeyen hata'}`
                                        }) + '\n\n');
                                        res.flush?.();
                                        reject(new Error(parsed.error.message || 'API hatası'));
                                        return;
                                    }
                                    
                                    // choices dizisi var mı kontrol et
                                    const content = parsed.choices && parsed.choices[0]?.delta?.content || '';
                                    
                                    // Tam içeriği biriktir
                                    fallbackContent += content;

                                    if (content.trim()) {
                                        // Apply the same preservation of newlines and special characters
                                        let processedContent = content;

                                        // Tablo içeriği tespit edildiğinde loglama yap ve basit düzeltmeler yap
                                        if (processedContent.includes('|')) {
                                            // Tablo formatını kontrol et
                                            const lines = processedContent.split('\n');
                                            const tableLines = lines.filter(line =>
                                                line.trim().startsWith('|') && line.trim().endsWith('|')
                                            );

                                            if (tableLines.length > 0) {
                                                // Tablo satırlarının başında ve sonunda boşluk olup olmadığını kontrol et
                                                // Eğer yoksa, ekle
                                                for (let i = 0; i < lines.length; i++) {
                                                    const line = lines[i];
                                                    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                                                        // Tablo satırının öncesinde ve sonrasında boş satır olup olmadığını kontrol et
                                                        const prevLine = i > 0 ? lines[i - 1] : '';
                                                        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

                                                        // Eğer öncesinde başlık varsa ve boş satır yoksa, boş satır ekle
                                                        if (prevLine.trim().startsWith('#') && !prevLine.trim().endsWith('\n\n')) {
                                                            processedContent = processedContent.replace(
                                                                prevLine + '\n' + line,
                                                                prevLine + '\n\n' + line
                                                            );
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        // İçeriği biriktir
                                        fallbackContentBuffer += processedContent;
                                        
                                        // Belirli koşullarda içeriği gönder
                                        const currentTime = Date.now();
                                        const timeElapsed = currentTime - fallbackLastFlushTime;
                                        const containsCompleteParagraph = fallbackContentBuffer.includes('\n\n') || 
                                                                         fallbackContentBuffer.includes('.\n') ||
                                                                         fallbackContentBuffer.includes(':\n');
                                        
                                        if (fallbackContentBuffer.length >= BUFFER_FLUSH_SIZE || 
                                            timeElapsed >= BUFFER_FLUSH_INTERVAL ||
                                            containsCompleteParagraph ||
                                            isFinalChunk) {
                                            flushFallbackContentBuffer();
                                        }
                                    }
                                } catch (parseError) {
                                    console.error('JSON parse error:', parseError, jsonData);
                                }
                            }
                        } catch (chunkError) {
                            console.error('Chunk processing error:', chunkError);
                        }
                    });

                    fallbackStream.data.on('end', () => {
                        // Son kalan içeriği gönder
                        flushFallbackContentBuffer();
                        resolve(fallbackContent);
                    });

                    fallbackStream.data.on('error', (streamError) => {
                        console.error('Fallback stream error:', streamError);
                        // Son kalan içeriği gönder
                        flushFallbackContentBuffer();
                        reject(streamError);
                    });
                    
                } catch (fallbackError) {
                    console.error('Fallback model also failed:', fallbackError);
                    reject(fallbackError);
                }
            }
            
        } catch (error) {
            reject(error);
        }
    });
}