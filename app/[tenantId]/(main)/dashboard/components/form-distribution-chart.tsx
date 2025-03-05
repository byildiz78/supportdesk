'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import DataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  DataLabels
);

interface FormDistributionChartProps {
  data: {
    form: string;
    count: number;
  }[];
}

export function FormDistributionChart({ data }: FormDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Veri bulunamadı
      </div>
    )
  }

  // Renk paleti
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue-500
    'rgba(99, 102, 241, 0.8)',   // indigo-500
    'rgba(139, 92, 246, 0.8)',   // violet-500
    'rgba(168, 85, 247, 0.8)',   // purple-500
    'rgba(217, 70, 239, 0.8)',   // fuchsia-500
    'rgba(236, 72, 153, 0.8)',   // pink-500
    'rgba(244, 63, 94, 0.8)',    // rose-500
    'rgba(239, 68, 68, 0.8)',    // red-500
    'rgba(249, 115, 22, 0.8)',   // orange-500
    'rgba(245, 158, 11, 0.8)',   // amber-500
  ];

  const borderColors = [
    'rgb(59, 130, 246)',    // blue-500
    'rgb(99, 102, 241)',    // indigo-500
    'rgb(139, 92, 246)',    // violet-500
    'rgb(168, 85, 247)',    // purple-500
    'rgb(217, 70, 239)',    // fuchsia-500
    'rgb(236, 72, 153)',    // pink-500
    'rgb(244, 63, 94)',     // rose-500
    'rgb(239, 68, 68)',     // red-500
    'rgb(249, 115, 22)',    // orange-500
    'rgb(245, 158, 11)',    // amber-500
  ];

  // Toplam denetim sayısı
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Verileri yüzdeye göre sırala ve %3'ten küçükleri "Diğer" altında topla
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const processedData = sortedData.reduce((acc, item) => {
    const percentage = (item.count / total) * 100;
    if (percentage < 3) {
      const otherIndex = acc.findIndex(item => item.form === 'Diğer Formlar');
      if (otherIndex === -1) {
        acc.push({ form: 'Diğer Formlar', count: item.count });
      } else {
        acc[otherIndex].count += item.count;
      }
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as typeof data);

  const chartData = {
    labels: processedData.map(item => item.form),
    datasets: [
      {
        data: processedData.map(item => item.count),
        backgroundColor: colors.slice(0, processedData.length),
        borderColor: borderColors.slice(0, processedData.length),
        borderWidth: 2,
        datalabels: {
          color: '#fff',
          font: {
            weight: '600' as const,
            size: 14
          },
          textStrokeColor: 'rgba(0, 0, 0, 0.5)',
          textStrokeWidth: 2,
          formatter: (value: number) => {
            const percentage = ((value / total) * 100).toFixed(1);
            return `%${percentage}`;
          }
        }
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#0f172a',
        bodyColor: '#0f172a',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString('tr-TR')} (%${percentage})`;
          }
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[80%] h-[80%] flex items-center justify-center">
          <Pie data={chartData as any} options={options} />
        </div>
      </div>
    </div>
  );
}
