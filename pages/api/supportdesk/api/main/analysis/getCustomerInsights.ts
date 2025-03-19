import { NextApiRequest, NextApiResponse } from 'next';

// Mock data generator function for customer insights
const generateCustomerInsightsData = () => {
  // Top customers by ticket volume
  const topCustomersByTickets = [
    { name: 'ABC Holding', tickets: 145, satisfaction: 4.7 },
    { name: 'XYZ Teknoloji', tickets: 112, satisfaction: 4.5 },
    { name: 'Mega İnşaat', tickets: 98, satisfaction: 4.8 },
    { name: 'Star Turizm', tickets: 87, satisfaction: 4.3 },
    { name: 'Global Lojistik', tickets: 76, satisfaction: 4.6 }
  ];

  // Ticket categories by customer
  const ticketCategoriesByCustomer = [
    { 
      customer: 'ABC Holding', 
      categories: [
        { name: 'Teknik Sorun', count: 68 },
        { name: 'Ürün Bilgisi', count: 42 },
        { name: 'Fatura', count: 25 },
        { name: 'Diğer', count: 10 }
      ]
    },
    { 
      customer: 'XYZ Teknoloji', 
      categories: [
        { name: 'Teknik Sorun', count: 54 },
        { name: 'Ürün Bilgisi', count: 31 },
        { name: 'Fatura', count: 18 },
        { name: 'Diğer', count: 9 }
      ]
    },
    { 
      customer: 'Mega İnşaat', 
      categories: [
        { name: 'Teknik Sorun', count: 42 },
        { name: 'Ürün Bilgisi', count: 28 },
        { name: 'Fatura', count: 20 },
        { name: 'Diğer', count: 8 }
      ]
    }
  ];

  // Customer satisfaction trends (last 6 months)
  const months = ['Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart'];
  const customerSatisfactionTrends = months.map(month => {
    const data = {
      month,
      'ABC Holding': 4.0 + Math.random() * 1.0,
      'XYZ Teknoloji': 4.0 + Math.random() * 1.0,
      'Mega İnşaat': 4.0 + Math.random() * 1.0,
      'Star Turizm': 4.0 + Math.random() * 1.0,
      'Global Lojistik': 4.0 + Math.random() * 1.0
    };
    return data;
  });

  // Customer segment distribution
  const customerSegmentDistribution = [
    { name: 'Kurumsal', value: 45 },
    { name: 'KOBİ', value: 30 },
    { name: 'Bireysel', value: 25 }
  ];

  // Customer performance comparison (radar chart data)
  const customerPerformanceComparison = [
    {
      customer: 'ABC Holding',
      metrics: [
        { metric: 'Talep Sayısı', value: 145 },
        { metric: 'Çözüm Süresi', value: 35 },
        { metric: 'Memnuniyet', value: 94 },
        { metric: 'Tekrar Eden Sorunlar', value: 12 },
        { metric: 'Öncelikli Talepler', value: 28 }
      ]
    },
    {
      customer: 'XYZ Teknoloji',
      metrics: [
        { metric: 'Talep Sayısı', value: 112 },
        { metric: 'Çözüm Süresi', value: 42 },
        { metric: 'Memnuniyet', value: 90 },
        { metric: 'Tekrar Eden Sorunlar', value: 18 },
        { metric: 'Öncelikli Talepler', value: 22 }
      ]
    },
    {
      customer: 'Mega İnşaat',
      metrics: [
        { metric: 'Talep Sayısı', value: 98 },
        { metric: 'Çözüm Süresi', value: 38 },
        { metric: 'Memnuniyet', value: 96 },
        { metric: 'Tekrar Eden Sorunlar', value: 8 },
        { metric: 'Öncelikli Talepler', value: 24 }
      ]
    }
  ];

  return {
    topCustomersByTickets,
    ticketCategoriesByCustomer,
    customerSatisfactionTrends,
    customerSegmentDistribution,
    customerPerformanceComparison
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // In a real implementation, you would use the query parameters to filter data
    // const { tenantId, ...filters } = req.query;
    
    // For now, we'll just return mock data
    const mockData = generateCustomerInsightsData();
    
    // Simulate a delay to mimic a real API call
    setTimeout(() => {
      res.status(200).json(mockData);
    }, 500);
  } catch (error) {
    console.error('Error in getCustomerInsights API:', error);
    res.status(500).json({ error: 'Failed to fetch customer insights data' });
  }
}
