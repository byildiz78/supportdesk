"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { LabelProps } from "recharts"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TicketTrendsChartProps {
  data: {
    'Gün': string;
    'Açılan Talepler': string;
    'Çözülen Talepler': string;
    'Ortalama Çözüm Süresi': string;
  }[];
}

export function TicketTrendsChart({ data }: TicketTrendsChartProps) {
  // Verileri grafiğe uygun formata dönüştür
  const chartData = data
    .sort((a, b) => {
      // Tarihleri karşılaştır (format: "dd MMM yyyy")
      const dateA = new Date(a['Gün'].split(' ').reverse().join(' '));
      const dateB = new Date(b['Gün'].split(' ').reverse().join(' '));
      return dateA.getTime() - dateB.getTime();
    })
    .map(item => {
      const opened = parseInt(item['Açılan Talepler']);
      const resolved = parseInt(item['Çözülen Talepler']);
      
      return {
        name: item['Gün'],
        "Açılan": opened,
        "Çözülen": resolved,
        "Total": opened + resolved,
      };
    });

  // Toplam talep sayılarını hesapla
  const totalOpened = chartData.reduce((sum, item) => sum + item.Açılan, 0);
  const totalResolved = chartData.reduce((sum, item) => sum + item.Çözülen, 0);

  // Özel etiket oluşturucu
  const renderCustomizedLabel = (props: LabelProps): ReactNode => {
    const { x, y, width, height, value } = props;
    
    if (typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number' ||
        !value) {
      return null;
    }
    
    // Küçük değerler için etiketi gösterme (opsiyonel)
    if (Number(value) < 2) return null;
    
    return (
      <g>
        <rect
          x={x + (width / 2) - 12}
          y={y + (height / 2) - 10}
          width={24}
          height={20}
          rx={4}
          fill="rgba(0, 0, 0, 0.6)"
        />
        <text 
          x={x + (width / 2)} 
          y={y + (height / 2) + 1} 
          fill="#FFFFFF" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontWeight="bold"
          fontSize="13"
        >
          {value}
        </text>
      </g>
    );
  };

  // Özel tooltip içeriği
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-background border border-border shadow-lg rounded-md p-3">
          <p className="tooltip-date font-bold text-sm text-foreground mb-2">{`Tarih: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="my-1 text-xs" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}: </span>
              <span>{`${entry.value} talep`}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Özel legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex justify-center mt-3 gap-5">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center cursor-pointer">
            <div 
              className="w-3 h-3 rounded mr-1.5" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.value} {index < 2 && (
                <span style={{ color: index === 0 ? "#3b82f6" : "#22c55e", fontWeight: "bold" }}>
                  (Toplam: {index === 0 ? totalOpened : totalResolved})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-card dark:bg-card rounded-lg shadow-sm p-4"  style={{ height: "320px" }}>
      <h3 className="m-0 mb-4 text-base font-bold text-foreground text-center">
        Talep Trendi
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart 
          data={chartData}
          margin={{ top: 25, right: 30, left: 20, bottom: 15 }}
          barSize={55}
          barGap={0}
          barCategoryGap="10%"
        >
          <defs>
            <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.9} />
            </linearGradient>
            <filter id="shadow" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
            </filter>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="var(--border)" 
            strokeOpacity={0.5}
          />
          <XAxis 
            dataKey="name" 
            tickFormatter={(value) => {
              // Sadece günü göster (örn: "16 Mar 2025" -> "16")
              const parts = value.split(' ');
              return parts[0];
            }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dx={-5}
            tickCount={5}
            width={40}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend 
            content={renderLegend}
            verticalAlign="top"
            height={50}
          />
          <Bar 
            dataKey="Açılan" 
            stackId="a"
            fill="url(#openedGradient)" 
            name="Açılan Talepler"
            radius={[4, 4, 0, 0]}
            strokeWidth={0}
            filter="url(#shadow)"
          >
            <LabelList 
              dataKey="Açılan" 
              content={renderCustomizedLabel}
              position="center"
            />
          </Bar>
          <Bar 
            dataKey="Çözülen" 
            stackId="a"
            fill="url(#resolvedGradient)" 
            name="Çözülen Talepler"
            radius={[4, 4, 0, 0]}
            strokeWidth={0}
            filter="url(#shadow)"
          >
            <LabelList 
              dataKey="Çözülen" 
              content={renderCustomizedLabel}
              position="center"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}