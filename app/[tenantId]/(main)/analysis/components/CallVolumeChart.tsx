"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TicketStat {
  'Saat': string;
  'Açılan Talepler': number;
  'Çözülen Talepler': number;
  'Bekleyen Talepler': number;
}

interface CallVolumeChartProps {
  data: TicketStat[];
}

export const CallVolumeChart: React.FC<CallVolumeChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.Saat),
    datasets: [
      {
        label: 'Açılan Talepler',
        data: data.map(item => item['Açılan Talepler']),
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Çözülen Talepler',
        data: data.map(item => item['Çözülen Talepler']),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Bekleyen Talepler',
        data: data.map(item => item['Bekleyen Talepler']),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
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
        text: 'Saatlik Talep Dağılımı',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};
