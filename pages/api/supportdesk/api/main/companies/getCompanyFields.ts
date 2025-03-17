import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Statik olarak tanımlanmış firma tablosu alanları ve açıklamaları
    const companyFields = {
      "id": { type: "uuid", title: "ID", description: "Firma Benzersiz Kimliği" },
      "parent_company_id": { type: "uuid", title: "Ana Firma ID", description: "Bağlı Olduğu Ana Firma" },
      "name": { type: "string", title: "Firma Adı", description: "Firma Adı" },
      "tax_id": { type: "string", title: "Vergi Numarası", description: "Vergi Kimlik Numarası" },
      "tax_office": { type: "string", title: "Vergi Dairesi", description: "Vergi Dairesi" },
      "address": { type: "text", title: "Adres", description: "Firma Adresi" },
      "city": { type: "string", title: "Şehir", description: "Şehir" },
      "state": { type: "string", title: "İlçe", description: "İlçe" },
      "postal_code": { type: "string", title: "Posta Kodu", description: "Posta Kodu" },
      "country": { type: "string", title: "Ülke", description: "Ülke" },
      "phone": { type: "string", title: "Telefon", description: "Telefon Numarası" },
      "email": { type: "string", title: "E-posta", description: "E-posta Adresi" },
      "website": { type: "string", title: "Web Sitesi", description: "Web Sitesi" },
      "industry": { type: "string", title: "Sektör", description: "Faaliyet Gösterdiği Sektör" },
      "company_type": { type: "string", title: "Firma Tipi", description: "Firma Tipi" },
      "notes": { type: "text", title: "Notlar", description: "Genel Notlar" },
      "is_active": { type: "boolean", title: "Aktif mi", description: "Firma Aktif mi" },
      "flow_ba_starting_date": { type: "date", title: "Flow BA Başlangıç Tarihi", description: "Flow BA Başlangıç Tarihi" },
      "flow_ba_end_date": { type: "date", title: "Flow BA Bitiş Tarihi", description: "Flow BA Bitiş Tarihi" },
      "flow_ba_notes": { type: "text", title: "Flow BA Notları", description: "Flow BA ile İlgili Notlar" },
      "flow_support_notes": { type: "text", title: "Flow Destek Notları", description: "Flow Destek ile İlgili Notlar" },
      "flow_licence_notes": { type: "text", title: "Flow Lisans Notları", description: "Flow Lisans ile İlgili Notlar" },
      "flow_id": { type: "integer", title: "Flow ID", description: "Flow Sistemindeki ID" },
      "flow_last_update_date": { type: "date", title: "Flow Son Güncelleme Tarihi", description: "Flow'dan Son Güncelleme Tarihi" }
    };
    
    // Sistem alanlarını hariç tut
    const excludedFields = ['created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'];
    
    // Sadece alanların isimlerini döndür (API uyumluluğu için)
    const fields = Object.keys(companyFields).filter(field => !excludedFields.includes(field));
    
    return res.status(200).json({
      success: true,
      fields,
      fieldDetails: companyFields
    });
  } catch (error: any) {
    console.error('Get company fields API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Firma alanları alınırken bir hata oluştu',
      details: error.message
    });
  }
}
