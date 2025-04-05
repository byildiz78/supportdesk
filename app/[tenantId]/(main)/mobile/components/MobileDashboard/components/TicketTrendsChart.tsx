"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { LabelProps } from "recharts"
import { ReactNode, useEffect, useState } from "react"
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
  // Ekran genişliği izleme
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 640);
    };

    // İlk yükleme kontrolü
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Son 5 günü göster (mobil cihazlarda)
  const mobileChartData = isMobile && chartData.length > 5
    ? chartData.slice(Math.max(0, chartData.length - 5))
    : chartData;

  // Veri yoksa boş grafik göster
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Grafik verisi bulunamadı</p>
      </div>
    );
  }

  // Toplam talep sayılarını hesapla
  const totalOpened = chartData.reduce((sum, item) => sum + item.Açılan, 0);
  const totalResolved = chartData.reduce((sum, item) => sum + item.Çözülen, 0);

  // Özel etiket oluşturucu
  const renderCustomizedLabel = (props: LabelProps): ReactNode => {
    const { x, y, width, height, value } = props;
    
    // Mobilde ve küçük bar'larda etiketi gösterme
    if (isMobile) return null;
    
    if (typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number' ||
        !value) {
      return null;
    }
    
    // Küçük değerler için etiketi gösterme
    if (Number(value) < 2) return null;
    
    // Çok dar barlar için etiketi gösterme
    if (width < 30) return null;
    
    const fontSize = windowWidth < 768 ? "11" : "13";
    const rectWidth = windowWidth < 768 ? 20 : 24;
    const rectHeight = windowWidth < 768 ? 16 : 20;
    
    return (
      <g>
        <rect
          x={x + (width / 2) - (rectWidth / 2)}
          y={y + (height / 2) - (rectHeight / 2)}
          width={rectWidth}
          height={rectHeight}
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
          fontSize={fontSize}
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
        <div className="custom-tooltip bg-background border border-border shadow-lg rounded-md p-2 sm:p-3 max-w-[200px] sm:max-w-none">
          <p className="tooltip-date font-bold text-xs sm:text-sm text-foreground mb-1 sm:mb-2 truncate">{`Tarih: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="my-0.5 sm:my-1 text-[10px] sm:text-xs truncate" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}: </span>
              <span>{`${entry.value} talep`}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Özel legend - mobil uyumlu
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap justify-center mt-1 sm:mt-3 gap-2 sm:gap-5">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center cursor-pointer">
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded mr-1 sm:mr-1.5" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {entry.value} {!isMobile && index < 2 && (
                <span className="hidden sm:inline" style={{ color: index === 0 ? "#3b82f6" : "#22c55e", fontWeight: "bold" }}>
                  (Toplam: {index === 0 ? totalOpened : totalResolved})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Bar genişliği hesaplama
  const barSize = isMobile ? 30 : windowWidth < 768 ? 40 : 55;
  const barCategoryGap = isMobile ? "5%" : "10%"; 

  return (
    <div className="w-full h-full bg-card dark:bg-card rounded-lg shadow-sm p-2 sm:p-4" style={{ height: "100%" }}>
      {/* Başlık mobilde gösterme - zaten component üstünde var */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={mobileChartData}
          margin={{ 
            top: isMobile ? 15 : 25, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? 0 : 20, 
            bottom: isMobile ? 10 : 15 
          }}
          barSize={barSize}
          barGap={0}
          barCategoryGap={barCategoryGap}
          layout={isMobile && chartData.length > 3 ? "vertical" : "horizontal"}
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
            vertical={!isMobile} 
            horizontal={true}
            stroke="var(--border)" 
            strokeOpacity={0.5}
          />
          
          {/* X ve Y eksenleri - mobil/masaüstü uyumlu */}
          {isMobile && chartData.length > 3 ? (
            <>
              <XAxis 
                type="number"
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                tickCount={3}
              />
              <YAxis 
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                width={60}
                tickFormatter={(value) => {
                  const parts = value.split(' ');
                  return `${parts[0]} ${parts[1]}`;
                }}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey="name" 
                tickFormatter={(value) => {
                  // Sadece günü göster (örn: "16 Mar 2025" -> "16")
                  const parts = value.split(' ');
                  return isMobile ? `${parts[0]}` : parts[0];
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: isMobile ? 10 : 12 }}
                dy={5}
                interval={isMobile ? 0 : "preserveEnd"}
                height={isMobile ? 30 : 50}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: isMobile ? 10 : 12 }}
                dx={-5}
                tickCount={isMobile ? 3 : 5}
                width={isMobile ? 25 : 40}
              />
            </>
          )}
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend 
            content={renderLegend}
            verticalAlign="top"
            height={isMobile ? 30 : 50}
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