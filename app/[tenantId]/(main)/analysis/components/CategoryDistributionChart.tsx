"use client";

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface TicketCategory {
  'Kategori': string;
  'Talep Sayısı': number;
}

interface CategoryDistributionChartProps {
  data: TicketCategory[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  // Renk paleti
  const backgroundColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 205, 86, 0.7)',
    'rgba(201, 203, 207, 0.7)'
  ];
  
  const borderColors = [
    'rgb(54, 162, 235)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(255, 99, 132)',
    'rgb(255, 205, 86)',
    'rgb(201, 203, 207)'
  ];

  const chartData = {
    labels: data.map(item => item.Kategori),
    datasets: [
      {
        data: data.map(item => item['Talep Sayısı']),
        backgroundColor: backgroundColors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      title: {
        display: false,
        text: 'Kategori Dağılımı',
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Pie data={chartData} options={options} />
    </div>
  );
};
