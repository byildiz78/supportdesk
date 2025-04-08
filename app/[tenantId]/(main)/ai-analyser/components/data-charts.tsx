'use client'

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DataChartsProps {
  data?: any[];
}

export function DataCharts({ data }: DataChartsProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [pieChartData, setPieChartData] = useState<any>(null);
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [dataFields, setDataFields] = useState<{
    branchField: string | null;
    revenueField: string | null;
    dateField: string | null;
  }>({
    branchField: null,
    revenueField: null,
    dateField: null
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Veri analizi yap
    identifyDataFields(data);
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0 || !dataFields.branchField || !dataFields.revenueField) return;
    
    // Veri alanları belirlendikten sonra grafikleri hazırla
    prepareCharts(data);
  }, [data, dataFields]);

  // Veri alanlarını otomatik olarak tespit et
  const identifyDataFields = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return;

    const firstRow = rawData[0];
    const fields = {
      branchField: null as string | null,
      revenueField: null as string | null,
      dateField: null as string | null
    };

    // Alanları tespit et
    Object.keys(firstRow).forEach(key => {
      const keyLower = key.toLowerCase();
      
      // Şube alanını tespit et
      if (keyLower.includes('şube') || keyLower.includes('sube') || 
          keyLower.includes('branch') || keyLower.includes('magaza') || 
          keyLower.includes('mağaza')) {
        fields.branchField = key;
      }
      
      // Ciro alanını tespit et
      else if (keyLower.includes('ciro') || keyLower.includes('revenue') || 
               keyLower.includes('satış') || keyLower.includes('satis') || 
               keyLower.includes('sales') || keyLower.includes('tutar') || 
               keyLower.includes('amount')) {
        fields.revenueField = key;
      }
      
      // Tarih alanını tespit et
      else if (keyLower.includes('tarih') || keyLower.includes('date') || 
               keyLower.includes('zaman') || keyLower.includes('time')) {
        fields.dateField = key;
      }
    });

    // Eğer şube alanı bulunamadıysa, ilk sayısal olmayan alanı kullan
    if (!fields.branchField) {
      for (const key of Object.keys(firstRow)) {
        const sampleSize = Math.min(5, rawData.length);
        let numericCount = 0;

        for (let i = 0; i < sampleSize; i++) {
          if (rawData[i] && !isNaN(parseFloat(rawData[i][key]))) {
            numericCount++;
          }
        }

        // Eğer bu alan çoğunlukla sayısal değilse, şube alanı olarak kullan
        if (numericCount < sampleSize / 2) {
          fields.branchField = key;
          break;
        }
      }
    }

    // Eğer ciro alanı bulunamadıysa, ilk sayısal alanı kullan
    if (!fields.revenueField) {
      for (const key of Object.keys(firstRow)) {
        const sampleSize = Math.min(5, rawData.length);
        let numericCount = 0;

        for (let i = 0; i < sampleSize; i++) {
          if (rawData[i] && !isNaN(parseFloat(rawData[i][key]))) {
            numericCount++;
          }
        }

        // Eğer bu alan çoğunlukla sayısalsa, ciro alanı olarak kullan
        if (numericCount >= sampleSize / 2) {
          fields.revenueField = key;
          break;
        }
      }
    }

    setDataFields(fields);
  };

  const prepareCharts = (rawData: any[]) => {
    if (!dataFields.branchField || !dataFields.revenueField) return;

    // Şube bazında ciro grafiği
    prepareBranchRevenueChart(rawData);
    
    // Ciro dağılımı pasta grafiği
    prepareRevenuePieChart(rawData);
    
    // Zaman serisi grafiği (eğer tarih alanı varsa)
    if (dataFields.dateField) {
      prepareTimeSeriesChart(rawData);
    } else {
      // Tarih yoksa, ciro trendi grafiği
      prepareRevenueTrendChart(rawData);
    }
  };

  const prepareBranchRevenueChart = (rawData: any[]) => {
    const { branchField, revenueField } = dataFields;
    if (!branchField || !revenueField) return;

    // Şubeleri ve cirolarını topla
    const branchData: Record<string, number> = {};
    
    rawData.forEach(item => {
      const branch = String(item[branchField]);
      const revenue = parseFloat(item[revenueField]) || 0;
      
      if (branch in branchData) {
        branchData[branch] += revenue;
      } else {
        branchData[branch] = revenue;
      }
    });

    // Verileri sırala (en yüksek cirodan en düşüğe)
    const sortedBranches = Object.entries(branchData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // En yüksek 10 şube

    const labels = sortedBranches.map(([branch]) => branch);
    const values = sortedBranches.map(([_, revenue]) => revenue);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Ciro',
          data: values,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    });
  };

  const prepareRevenuePieChart = (rawData: any[]) => {
    const { branchField, revenueField } = dataFields;
    if (!branchField || !revenueField) return;

    // Şubeleri ve cirolarını topla
    const branchData: Record<string, number> = {};
    
    rawData.forEach(item => {
      const branch = String(item[branchField]);
      const revenue = parseFloat(item[revenueField]) || 0;
      
      if (branch in branchData) {
        branchData[branch] += revenue;
      } else {
        branchData[branch] = revenue;
      }
    });

    // Verileri sırala ve en yüksek 5 şubeyi al
    const sortedBranches = Object.entries(branchData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const labels = sortedBranches.map(([branch]) => branch);
    const values = sortedBranches.map(([_, revenue]) => revenue);

    // Toplam ciroyu hesapla (yüzde için)
    const totalRevenue = values.reduce((sum, value) => sum + value, 0);

    setPieChartData({
      labels,
      datasets: [
        {
          label: 'Ciro',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const prepareTimeSeriesChart = (rawData: any[]) => {
    const { dateField, revenueField } = dataFields;
    if (!dateField || !revenueField) return;

    // Tarihe göre ciroları grupla
    const dateData: Record<string, number> = {};
    
    rawData.forEach(item => {
      let dateStr = String(item[dateField]);
      // Tarih formatını basitleştir (sadece tarih kısmını al)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      
      const revenue = parseFloat(item[revenueField]) || 0;
      
      if (dateStr in dateData) {
        dateData[dateStr] += revenue;
      } else {
        dateData[dateStr] = revenue;
      }
    });

    // Tarihleri sırala
    const sortedDates = Object.entries(dateData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .slice(0, 15); // En fazla 15 tarih

    const labels = sortedDates.map(([date]) => date);
    const values = sortedDates.map(([_, revenue]) => revenue);

    setLineChartData({
      labels,
      datasets: [
        {
          label: 'Günlük Ciro',
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    });
  };

  const prepareRevenueTrendChart = (rawData: any[]) => {
    const { branchField, revenueField } = dataFields;
    if (!branchField || !revenueField) return;

    // Şubeleri ve cirolarını topla
    const branchData: Record<string, number> = {};
    
    rawData.forEach(item => {
      const branch = String(item[branchField]);
      const revenue = parseFloat(item[revenueField]) || 0;
      
      if (branch in branchData) {
        branchData[branch] += revenue;
      } else {
        branchData[branch] = revenue;
      }
    });

    // Verileri sırala ve en yüksek 15 şubeyi al
    const sortedBranches = Object.entries(branchData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const labels = sortedBranches.map(([branch]) => branch);
    const values = sortedBranches.map(([_, revenue]) => revenue);

    setLineChartData({
      labels,
      datasets: [
        {
          label: 'Şube Ciroları',
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    });
  };

  // Para birimi formatı
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Grafik oluşturmak için veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {chartData && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Şube Bazında Ciro Dağılımı
            {dataFields.branchField && dataFields.revenueField && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({dataFields.branchField} - {dataFields.revenueField})
              </span>
            )}
          </h3>
          <div className="h-80">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Ciro: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pieChartData && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              En Yüksek Cirolu 5 Şube
            </h3>
            <div className="h-64">
              <Pie 
                data={pieChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = Math.round((value * 100) / total);
                          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }} 
              />
            </div>
          </div>
        )}

        {lineChartData && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {dataFields.dateField ? 'Günlük Ciro Trendi' : 'Şube Ciro Dağılımı'}
            </h3>
            <div className="h-64">
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Ciro: ${formatCurrency(context.parsed.y)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value as number);
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
