'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DataLabels from 'chartjs-plugin-datalabels';
import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { useAudit } from '@/hooks/useAudit';
import { useTabStore } from '@/stores/tab-store';

// ChartJS kaydını bir kere yapıyoruz
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    DataLabels
  );
}

interface ChartCardProps {
  branches: number[];
  date: string;
  refreshTrigger: number;
}

export function ChartCard({ branches, date, refreshTrigger }: ChartCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { activeTab } = useTabStore();
  const isDashboardActive = activeTab === "dashboard";
  const [localFilter, setLocalFilter] = useState({ branches, date });

  // Dashboard aktifken filter değişince local state'i güncelle
  useEffect(() => {
    if (isDashboardActive) {
      setLocalFilter({ branches, date });
    }
  }, [isDashboardActive, branches, date]);

  // Mobile detection
  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < 768);
    }, 100);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: auditData, isLoading, error } = useAudit(
    isDashboardActive 
      ? { 
          branches: localFilter.branches, 
          date: localFilter.date, 
          refreshTrigger 
        } 
      : null
  );

  const chartData = React.useMemo(() => {
    if (!auditData?.length) return {
      labels: [],
      datasets: []
    };

    return {
      labels: auditData.map(item => item.monthName),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Denetim Sayısı',
          data: auditData.map(item => item.registrationCount),
          backgroundColor: auditData.map((_, index) => {
            const colors = [
              '#3b82f6', // blue
              '#10b981', // green
              '#8b5cf6', // purple
              '#f59e0b', // amber
              '#ef4444', // red
              '#06b6d4', // cyan
              '#ec4899', // pink
              '#f97316', // orange
              '#6366f1', // indigo
              '#14b8a6', // teal
              '#84cc16', // lime
              '#a855f7', // violet
            ];
            return colors[index % colors.length];
          }),
          borderRadius: 6,
          borderWidth: 0,
          datalabels: {
            display: !isMobile,
            color: '#4b5563',
            anchor: 'end',
            align: 'top',
            offset: 4,
            formatter: (value: number) => value.toLocaleString('tr-TR'),
            font: {
              weight: '600',
              size: isMobile ? 11 : 13
            },
            padding: {
              top: 4
            }
          }
        }
      ],
    };
  }, [auditData, isMobile]);

  const options = React.useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        datalabels: {
          display: !isMobile,
          color: '#4b5563',
          anchor: 'end',
          align: 'top',
          offset: 4,
          formatter: (value: number) => value.toLocaleString('tr-TR'),
          font: {
            weight: '600',
            size: isMobile ? 11 : 13
          },
          padding: {
            top: 4
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          padding: 10,
          titleFont: {
            size: isMobile ? 12 : 14
          },
          bodyFont: {
            size: isMobile ? 11 : 13
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: isMobile ? 11 : 13
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb',
          },
          ticks: {
            font: {
              size: isMobile ? 11 : 13
            },
            callback: (value: number) => value.toLocaleString('tr-TR')
          }
        }
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 30,  
          bottom: 0
        }
      },
      barThickness: 32,
      maxBarThickness: 40
    };
  }, [isMobile]);

  if (!isDashboardActive) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50 shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 p-6">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Denetim Trendi
          </h3>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50 shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-red-500">
            Hata Oluştu
          </h3>
          <p className="text-[0.925rem] text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50 shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 p-6">
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Denetim Trendi
        </h3>
        <p className="text-[0.925rem] text-muted-foreground">
          Aylık denetim sayıları
        </p>
      </div>
      <div className="h-[300px]">
        <Bar data={chartData as any} options={options as any} />
      </div>
    </div>
  );
}