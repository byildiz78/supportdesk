export const mockCategories = [
    {
        id: "CAT-001",
        name: "Yazılım",
        description: "Yazılım ile ilgili destek talepleri",
        createdAt: "2024-01-01T09:00:00Z",
        updatedAt: "2024-01-01T09:00:00Z",
        subcategories: [
            {
                id: "SUB-001",
                name: "İnfina",
                description: "İnfina uygulaması ile ilgili talepler",
                categoryId: "CAT-001",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-001",
                        name: "Hatalar",
                        description: "İnfina uygulamasında karşılaşılan hatalar",
                        subcategoryId: "SUB-001",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-002",
                        name: "Kullanıcı Yardımı",
                        description: "İnfina kullanımı ile ilgili yardım talepleri",
                        subcategoryId: "SUB-001",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-003",
                        name: "İyileştirme Talepleri",
                        description: "İnfina için önerilen iyileştirmeler",
                        subcategoryId: "SUB-001",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            },
            {
                id: "SUB-002",
                name: "Web Rapor",
                description: "Web Rapor uygulaması ile ilgili talepler",
                categoryId: "CAT-001",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-004",
                        name: "Rapor Hataları",
                        description: "Web Rapor'da karşılaşılan hatalar",
                        subcategoryId: "SUB-002",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-005",
                        name: "Yeni Rapor Talepleri",
                        description: "Yeni rapor oluşturma talepleri",
                        subcategoryId: "SUB-002",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            }
        ]
    },
    {
        id: "CAT-002",
        name: "Donanım",
        description: "Donanım ile ilgili destek talepleri",
        createdAt: "2024-01-01T09:00:00Z",
        updatedAt: "2024-01-01T09:00:00Z",
        subcategories: [
            {
                id: "SUB-003",
                name: "Bilgisayarlar",
                description: "Bilgisayarlar ile ilgili talepler",
                categoryId: "CAT-002",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-006",
                        name: "Masaüstü Bilgisayarlar",
                        description: "Masaüstü bilgisayarlar ile ilgili sorunlar",
                        subcategoryId: "SUB-003",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-007",
                        name: "Dizüstü Bilgisayarlar",
                        description: "Dizüstü bilgisayarlar ile ilgili sorunlar",
                        subcategoryId: "SUB-003",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            },
            {
                id: "SUB-004",
                name: "Yazıcılar",
                description: "Yazıcılar ile ilgili talepler",
                categoryId: "CAT-002",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-008",
                        name: "Ağ Yazıcıları",
                        description: "Ağ yazıcıları ile ilgili sorunlar",
                        subcategoryId: "SUB-004",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-009",
                        name: "Yerel Yazıcılar",
                        description: "Yerel yazıcılar ile ilgili sorunlar",
                        subcategoryId: "SUB-004",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            }
        ]
    },
    {
        id: "CAT-003",
        name: "Hizmet",
        description: "Hizmet ile ilgili destek talepleri",
        createdAt: "2024-01-01T09:00:00Z",
        updatedAt: "2024-01-01T09:00:00Z",
        subcategories: [
            {
                id: "SUB-005",
                name: "Eğitim",
                description: "Eğitim hizmetleri ile ilgili talepler",
                categoryId: "CAT-003",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-010",
                        name: "Uygulama Eğitimleri",
                        description: "Uygulama kullanımı eğitimleri",
                        subcategoryId: "SUB-005",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-011",
                        name: "Teknik Eğitimler",
                        description: "Teknik konularda eğitimler",
                        subcategoryId: "SUB-005",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            },
            {
                id: "SUB-006",
                name: "Danışmanlık",
                description: "Danışmanlık hizmetleri ile ilgili talepler",
                categoryId: "CAT-003",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
                groups: [
                    {
                        id: "GRP-012",
                        name: "Proje Danışmanlığı",
                        description: "Proje yönetimi danışmanlığı",
                        subcategoryId: "SUB-006",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    },
                    {
                        id: "GRP-013",
                        name: "Süreç Danışmanlığı",
                        description: "İş süreçleri danışmanlığı",
                        subcategoryId: "SUB-006",
                        createdAt: "2024-01-01T09:00:00Z",
                        updatedAt: "2024-01-01T09:00:00Z"
                    }
                ]
            }
        ]
    }
];
