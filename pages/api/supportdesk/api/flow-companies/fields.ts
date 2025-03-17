import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Statik olarak tanımlanmış Flow firma alanları
    const flowFields = {
      "ID": { type: "string", title: "Flow ID", listLabel: "Flow ID" },
      "TITLE": { type: "string", title: "Firma Adı", listLabel: "Firma Adı" },
      "ASSIGNED_BY_ID": { type: "string", title: "Atanan Kişi ID", listLabel: "Atanan Kişi" },
      "DATE_CREATE": { type: "date", title: "Oluşturma Tarihi", listLabel: "Oluşturma Tarihi" },
      "DATE_MODIFY": { type: "date", title: "Güncelleme Tarihi", listLabel: "Güncelleme Tarihi" },
      "CREATED_BY_ID": { type: "string", title: "Oluşturan Kişi ID", listLabel: "Oluşturan Kişi" },
      "MODIFY_BY_ID": { type: "string", title: "Güncelleyen Kişi ID", listLabel: "Güncelleyen Kişi" },
      "ADDRESS": { type: "string", title: "Adres", listLabel: "Adres" },
      "ADDRESS_2": { type: "string", title: "Adres 2", listLabel: "Adres 2" },
      "ADDRESS_CITY": { type: "string", title: "Şehir", listLabel: "Şehir" },
      "ADDRESS_POSTAL_CODE": { type: "string", title: "Posta Kodu", listLabel: "Posta Kodu" },
      "ADDRESS_REGION": { type: "string", title: "Bölge", listLabel: "Bölge" },
      "ADDRESS_PROVINCE": { type: "string", title: "İlçe", listLabel: "İlçe" },
      "ADDRESS_COUNTRY": { type: "string", title: "Ülke", listLabel: "Ülke" },
      "PHONE": { type: "string", title: "Telefon", listLabel: "Telefon" },
      "EMAIL": { type: "string", title: "E-posta", listLabel: "E-posta" },
      "WEB": { type: "string", title: "Web Sitesi", listLabel: "Web Sitesi" },
      "BANKING_DETAILS": { type: "string", title: "Banka Bilgileri", listLabel: "Banka Bilgileri" },
      "INDUSTRY": { type: "string", title: "Sektör", listLabel: "Sektör" },
      "REVENUE": { type: "string", title: "Gelir", listLabel: "Gelir" },
      "EMPLOYEES": { type: "string", title: "Çalışan Sayısı", listLabel: "Çalışan Sayısı" },
      "COMMENTS": { type: "string", title: "Yorumlar", listLabel: "Yorumlar" },
      "COMPANY_TYPE": { type: "string", title: "Firma Tipi", listLabel: "Firma Tipi" },
      "CURRENCY_ID": { type: "string", title: "Para Birimi ID", listLabel: "Para Birimi" },
      
      // Özel alanlar - Flow API'den gelen gerçek değerlerle
      "UF_CRM_1234567890": { type: "string", title: "UF_CRM_1234567890", listLabel: "Vergi Numarası" },
      "UF_CRM_0987654321": { type: "string", title: "UF_CRM_0987654321", listLabel: "Vergi Dairesi" },
      "UF_CRM_66E9FD772BEBB": { type: "string", title: "UF_CRM_66E9FD772BEBB", listLabel: "Müşteri Tipi" },
      "UF_CRM_66E9FD773A522": { type: "string", title: "UF_CRM_66E9FD773A522", listLabel: "Müşteri Kategorisi" },
      "UF_CRM_1727121653111": { type: "string", title: "UF_CRM_1727121653111", listLabel: "Sözleşme Durumu" },
      "UF_CRM_1727121670364": { type: "string", title: "UF_CRM_1727121670364", listLabel: "Sözleşme Bitiş Tarihi" },
      "UF_CRM_1730539055531": { type: "string", title: "UF_CRM_1730539055531", listLabel: "Lisanslı Ürünler" }
    };
    
    return res.status(200).json({
      success: true,
      result: flowFields
    });
  } catch (error: any) {
    console.error('Get flow fields API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Flow firma alanları alınırken bir hata oluştu',
      details: error.message
    });
  }
}
