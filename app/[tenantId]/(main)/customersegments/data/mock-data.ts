// Örnek müşteri segmentleri
export const customers = [
    {
        id: 1,
        name: "VIP Müşteriler",
        customerCount: 156,
        rules: ["Aylık >5000₺", "Son 6 ay aktif", "Düzenli sipariş"],
        isActive: true
    },
    {
        id: 2,
        name: "Yeni Müşteriler",
        customerCount: 324,
        rules: ["Son 30 gün kayıt", "İlk sipariş"],
        isActive: true
    },
    {
        id: 3,
        name: "Kaybedilen Müşteriler",
        customerCount: 89,
        rules: ["90+ gün inaktif", "Önceden aktif"],
        isActive: false
    }
];

// Örnek statü seçenekleri
export const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif" },
    { value: "passive", label: "Pasif" }
];

// Örnek tip seçenekleri
export const typeOptions = [
    { value: "all", label: "Tüm Tipler" },
    { value: "purchase", label: "Satın Alma" },
    { value: "frequency", label: "Sıklık" },
    { value: "loyalty", label: "Sadakat" },
    { value: "demographic", label: "Demografik" }
];