import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// API yanıt tipi tanımları
type CompanyData = {
  ID: string;
  TITLE: string;
  [key: string]: any;
};

type ApiResponse = {
  result: CompanyData[];
  total: number;
  time: {
    date_start: string;
    date_finish: string;
    duration_ms?: number;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sadece POST isteklerine izin ver
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = new Date();

  try {
    const requestData = req.body;
    let allCompanies: CompanyData[] = [];
    let hasMoreData = true;
    let start = 0;
    let total = 0;
    let pageCount = 0;
    const API_URL = "https://crm.robotpos.com/rest/1/q5w7kffwsbyyct5i/crm.company.list";
    const MAX_RETRIES = 3;
    
    // Tüm verileri toplayana kadar döngüye devam et
    while (hasMoreData) {
      pageCount++;
      let retries = 0;
      let success = false;
      
      // Hata durumunda birkaç kez tekrar dene
      while (retries < MAX_RETRIES && !success) {
        try {
          // Her istekte start parametresini güncelle
          const currentRequestData = {
            ...requestData,
            start: start
          };
          
          const response = await axios.post(
            API_URL,
            currentRequestData,
            {
              headers: {
                "Content-Type": "application/json",
                "Cookie": "qmb=0."
              },
              timeout: 30000 // 30 saniye timeout
            }
          );
          
          const data = response.data;
          
          // İlk istekte toplam sayıyı kaydet
          if (total === 0 && data.total) {
            total = data.total;
          }
          
          // Gelen şirketleri ana listeye ekle
          if (data.result && Array.isArray(data.result)) {
            allCompanies = [...allCompanies, ...data.result];
          }
          
          // Sonraki sayfa var mı kontrol et
          if (data.next) {
            start = data.next;
          } else {
            hasMoreData = false;
          }
          
          // Eğer toplam kayıt sayısına ulaştıysak döngüyü sonlandır
          if (allCompanies.length >= total) {
            hasMoreData = false;
          }
          
          success = true;
        } catch (err) {
          retries++;
          
          // Son deneme başarısız olduysa hata fırlat
          if (retries === MAX_RETRIES) {
            throw new Error(`API request failed after ${MAX_RETRIES} retries on page ${pageCount}`);
          }
          
          // Tekrar denemeden önce kısa bir bekle
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Tüm şirketleri ve toplam sayıyı içeren yanıtı döndür
    const response: ApiResponse = {
      result: allCompanies,
      total: total,
      time: {
        date_start: startTime.toISOString(),
        date_finish: endTime.toISOString(),
        duration_ms: duration
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error("Error fetching flow companies:", error);
    
    return res.status(500).json({ 
      error: "Failed to fetch flow companies", 
      message: error.message || "Unknown error",
      time: {
        date_start: startTime.toISOString(),
        date_finish: new Date().toISOString()
      }
    });
  }
}