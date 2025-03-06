export const mockTickets = [
    {
        id: "TICKET-001",
        title: "Sistem Erişim Sorunu",
        description: "Kullanıcılar sisteme giriş yaparken hata alıyor. Acil incelenmesi gerekiyor.",
        status: "open",
        priority: "high",
        source: "email",
        category: "technical",
        assignedTo: "agent1",
        assignedToName: "Ahmet Yılmaz",
        createdBy: "customer",
        createdAt: "2024-03-20T10:30:00Z",
        updatedAt: "2024-03-20T10:30:00Z",
        customerName: "Mehmet Demir",
        customerEmail: "mehmet.demir@example.com",
        customerPhone: "+90 555 123 4567",
        tags: ["Erişim", "Sistem", "Acil"],
        comments: [
            {
                id: "1",
                ticketId: "TICKET-001",
                content: "Merhaba, talebinizi aldık. Sistem ekibimiz incelemeye başladı.",
                createdBy: "agent1",
                createdByName: "Ahmet Yılmaz",
                createdAt: "2024-03-20T10:35:00Z",
                isInternal: false
            },
            {
                id: "2",
                ticketId: "TICKET-001",
                content: "Veritabanı bağlantısında sorun tespit edildi. Çözüm için çalışıyoruz.",
                createdBy: "agent2",
                createdByName: "Ayşe Kaya",
                createdAt: "2024-03-20T11:00:00Z",
                isInternal: true
            },
            {
                id: "3",
                ticketId: "TICKET-001",
                content: "Sorun çözüldü, test edebilirsiniz.",
                createdBy: "agent1",
                createdByName: "Ahmet Yılmaz",
                createdAt: "2024-03-20T11:30:00Z",
                isInternal: false
            }
        ]
    },
    {
        id: "TICKET-002",
        title: "Fatura Düzeltme Talebi",
        description: "Son faturada hatalı tutar görünüyor. Kontrol edilmesi rica olunur.",
        status: "in_progress",
        priority: "medium",
        source: "phone",
        category: "billing",
        assignedTo: "agent2",
        assignedToName: "Ayşe Kaya",
        createdBy: "customer",
        createdAt: "2024-03-19T14:20:00Z",
        updatedAt: "2024-03-19T14:20:00Z",
        customerName: "Ali Yıldız",
        customerEmail: "ali.yildiz@example.com",
        customerPhone: "+90 555 987 6543",
        tags: ["Fatura", "Düzeltme"],
        comments: [
            {
                id: "1",
                ticketId: "TICKET-002",
                content: "Faturanızı incelemeye aldık.",
                createdBy: "agent2",
                createdByName: "Ayşe Kaya",
                createdAt: "2024-03-19T14:25:00Z",
                isInternal: false
            },
            {
                id: "2",
                ticketId: "TICKET-002",
                content: "Muhasebe ile görüşüldü, düzeltme yapılacak.",
                createdBy: "agent2",
                createdByName: "Ayşe Kaya",
                createdAt: "2024-03-19T15:00:00Z",
                isInternal: true
            }
        ]
    },
    {
        id: "TICKET-003",
        title: "Yeni Özellik Talebi",
        description: "Raporlama sistemine yeni bir filtreleme özelliği eklenmesi talebi.",
        status: "pending",
        priority: "low",
        source: "web",
        category: "feature_request",
        assignedTo: "agent3",
        assignedToName: "Can Demir",
        createdBy: "customer",
        createdAt: "2024-03-18T09:15:00Z",
        updatedAt: "2024-03-18T09:15:00Z",
        customerName: "Zeynep Şahin",
        customerEmail: "zeynep.sahin@example.com",
        customerPhone: "+90 555 456 7890",
        tags: ["Özellik", "Raporlama"],
        comments: [
            {
                id: "1",
                ticketId: "TICKET-003",
                content: "Talebinizi aldık, geliştirme ekibine ilettik.",
                createdBy: "agent3",
                createdByName: "Can Demir",
                createdAt: "2024-03-18T09:30:00Z",
                isInternal: false
            }
        ]
    },
    {
        id: "TICKET-004",
        title: "Mobil Uygulama Hatası",
        description: "iOS uygulamasında sipariş oluşturulurken hata alınıyor.",
        status: "resolved",
        priority: "high",
        source: "email",
        category: "technical",
        assignedTo: "agent1",
        assignedToName: "Ahmet Yılmaz",
        createdBy: "customer",
        createdAt: "2024-03-17T16:45:00Z",
        updatedAt: "2024-03-17T16:45:00Z",
        customerName: "Elif Öztürk",
        customerEmail: "elif.ozturk@example.com",
        customerPhone: "+90 555 234 5678",
        tags: ["Mobil", "iOS", "Hata"],
        comments: [
            {
                id: "1",
                ticketId: "TICKET-004",
                content: "Hatayı tespit ettik, iOS ekibi inceliyor.",
                createdBy: "agent1",
                createdByName: "Ahmet Yılmaz",
                createdAt: "2024-03-17T17:00:00Z",
                isInternal: false
            },
            {
                id: "2",
                ticketId: "TICKET-004",
                content: "iOS 17.4 sürümünde bir uyumluluk sorunu tespit edildi.",
                createdBy: "agent1",
                createdByName: "Ahmet Yılmaz",
                createdAt: "2024-03-17T17:30:00Z",
                isInternal: true
            },
            {
                id: "3",
                ticketId: "TICKET-004",
                content: "Sorun giderildi, yeni güncelleme yayınlandı.",
                createdBy: "agent1",
                createdByName: "Ahmet Yılmaz",
                createdAt: "2024-03-17T18:15:00Z",
                isInternal: false
            }
        ]
    },
    {
        id: "TICKET-005",
        title: "Entegrasyon Problemi",
        description: "Üçüncü parti entegrasyonunda veri aktarım sorunu yaşanıyor.",
        status: "open",
        priority: "medium",
        source: "web",
        category: "integration",
        assignedTo: "agent2",
        assignedToName: "Ayşe Kaya",
        createdBy: "customer",
        createdAt: "2024-03-16T11:30:00Z",
        updatedAt: "2024-03-16T11:30:00Z",
        customerName: "Murat Aydın",
        customerEmail: "murat.aydin@example.com",
        customerPhone: "+90 555 345 6789",
        tags: ["Entegrasyon", "API"],
        comments: [
            {
                id: "1",
                ticketId: "TICKET-005",
                content: "API loglarını incelemeye başladık.",
                createdBy: "agent2",
                createdByName: "Ayşe Kaya",
                createdAt: "2024-03-16T11:45:00Z",
                isInternal: false
            },
            {
                id: "2",
                ticketId: "TICKET-005",
                content: "Rate limit aşımı tespit edildi, limit artırımı gerekiyor.",
                createdBy: "agent2",
                createdByName: "Ayşe Kaya",
                createdAt: "2024-03-16T12:00:00Z",
                isInternal: true
            }
        ]
    }
];