"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"
import { LabelProps } from "recharts"
import { ReactNode } from "react"

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
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px',
          border: 'none',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <p className="tooltip-date" style={{ 
            margin: '0 0 8px', 
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333'
          }}>{`Tarih: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ 
              margin: '4px 0',
              fontSize: '13px',
              color: entry.color
            }}>
              <span style={{ fontWeight: 'bold' }}>{entry.name}: </span>
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '10px',
        gap: '20px'
      }}>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              borderRadius: '3px',
              marginRight: '6px'
            }} />
            <span style={{ fontSize: '13px', color: '#666' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      padding: '15px'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        fontSize: '16px', 
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center'
      }}>
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
            stroke="#e5e7eb" 
            strokeOpacity={0.8}
          />
          <XAxis 
            dataKey="name" 
            tickFormatter={(value) => {
              // Sadece günü göster (örn: "16 Mar 2025" -> "16")
              const parts = value.split(' ');
              return parts[0];
            }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
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