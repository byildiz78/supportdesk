"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WaitTime {
  'Saat': string;
  'Atama Süresi (dk)': number;
  'Çözüm Süresi (dk)': number;
}

interface WaitTimeChartProps {
  data: WaitTime[];
}

export const WaitTimeChart: React.FC<WaitTimeChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.Saat),
    datasets: [
      {
        label: 'Atama Süresi (dk)',
        data: data.map(item => item['Atama Süresi (dk)']),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Çözüm Süresi (dk)',
        data: data.map(item => item['Çözüm Süresi (dk)']),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.3,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
        text: 'Bekleme Süreleri',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Dakika'
        }
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};
