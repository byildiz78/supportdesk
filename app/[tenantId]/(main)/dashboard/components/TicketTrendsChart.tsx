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
        typeof width !== 'number' || typeof height !== 'number') {
      return null;
    }
    
    return (
      <text 
        x={x + (width / 2)} 
        y={y + (height / 2)} 
        fill="#FFFFFF" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize="11"
      >
        {value}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tickFormatter={(value) => {
            // Sadece günü göster (örn: "16 Mar 2025" -> "16")
            const parts = value.split(' ');
            return parts[0];
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === "Açılan") return [`${value} talep`, "Açılan Talepler"];
            if (name === "Çözülen") return [`${value} talep`, "Çözülen Talepler"];
            return [value, name];
          }}
          labelFormatter={(label) => `Tarih: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="Açılan" 
          stackId="a"
          fill="#2563eb" 
          name="Açılan Talepler"
        >
          <LabelList 
            dataKey="Açılan" 
            content={renderCustomizedLabel}
          />
        </Bar>
        <Bar 
          dataKey="Çözülen" 
          stackId="a"
          fill="#16a34a" 
          name="Çözülen Talepler"
        >
          <LabelList 
            dataKey="Çözülen" 
            content={renderCustomizedLabel}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}