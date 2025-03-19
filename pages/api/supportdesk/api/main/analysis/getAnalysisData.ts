import { NextApiRequest, NextApiResponse } from 'next';

// Mock data generator function
const generateMockData = () => {
  // Agent performance data
  const agentPerformance = [
    {
      'Temsilci': 'Ahmet Yılmaz',
      'Çözülen Talep': 87,
      'Ortalama Çözüm Süresi (dk)': 42,
      'Memnuniyet Puanı': 4.8
    },
    {
      'Temsilci': 'Ayşe Demir',
      'Çözülen Talep': 64,
      'Ortalama Çözüm Süresi (dk)': 38,
      'Memnuniyet Puanı': 4.6
    },
    {
      'Temsilci': 'Mehmet Kaya',
      'Çözülen Talep': 92,
      'Ortalama Çözüm Süresi (dk)': 35,
      'Memnuniyet Puanı': 4.9
    },
    {
      'Temsilci': 'Zeynep Şahin',
      'Çözülen Talep': 71,
      'Ortalama Çözüm Süresi (dk)': 45,
      'Memnuniyet Puanı': 4.5
    },
    {
      'Temsilci': 'Can Öztürk',
      'Çözülen Talep': 58,
      'Ortalama Çözüm Süresi (dk)': 50,
      'Memnuniyet Puanı': 4.3
    }
  ];

  // Hourly ticket statistics
  const ticketStats = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}:00` : `${i}:00`;
    const newTickets = Math.floor(Math.random() * 20) + 5;
    const resolvedTickets = Math.floor(Math.random() * newTickets) + 5;
    const pendingTickets = Math.floor(Math.random() * 10) + 2;
    
    return {
      'Saat': hour,
      'Açılan Talepler': newTickets,
      'Çözülen Talepler': resolvedTickets,
      'Bekleyen Talepler': pendingTickets
    };
  });

  // Wait times
  const waitTimes = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}:00` : `${i}:00`;
    
    return {
      'Saat': hour,
      'Atama Süresi (dk)': Math.floor(Math.random() * 15) + 5,
      'Çözüm Süresi (dk)': Math.floor(Math.random() * 60) + 30
    };
  });

  // Category distribution
  const ticketCategories = [
    {
      'Kategori': 'Teknik Sorun',
      'Talep Sayısı': 245
    },
    {
      'Kategori': 'Ürün Bilgisi',
      'Talep Sayısı': 187
    },
    {
      'Kategori': 'Fatura',
      'Talep Sayısı': 132
    },
    {
      'Kategori': 'Şikayet',
      'Talep Sayısı': 98
    },
    {
      'Kategori': 'Öneri',
      'Talep Sayısı': 76
    }
  ];

  return {
    totalTickets: {
      'Toplam Talep': '738',
      'Değişim (Bu Ay)': '12.5'
    },
    resolvedTickets: {
      'Çözülen Talep': '652',
      'Çözüm Oranı': '88.3%'
    },
    pendingTickets: {
      'Bekleyen Talep': '86',
      'Bekleyen Oranı': '11.7%'
    },
    agentPerformance,
    ticketStats,
    waitTimes,
    ticketCategories,
    hourlyTicketStats: ticketStats
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // In a real implementation, you would use the query parameters to filter data
    // const { tenantId, ...filters } = req.query;
    
    // For now, we'll just return mock data
    const mockData = generateMockData();
    
    // Simulate a delay to mimic a real API call
    setTimeout(() => {
      res.status(200).json(mockData);
    }, 500);
  } catch (error) {
    console.error('Error in getAnalysisData API:', error);
    res.status(500).json({ error: 'Failed to fetch analysis data' });
  }
}
