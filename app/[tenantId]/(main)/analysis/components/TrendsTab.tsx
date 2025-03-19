"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp, PieChart as PieChartIcon, Calendar, Clock } from "lucide-react";

// Mock data for ticket volume trends
const ticketVolumeTrends = [
  { date: "01/03", newTickets: 42, resolvedTickets: 38, pendingTickets: 12 },
  { date: "02/03", newTickets: 38, resolvedTickets: 35, pendingTickets: 15 },
  { date: "03/03", newTickets: 45, resolvedTickets: 40, pendingTickets: 20 },
  { date: "04/03", newTickets: 50, resolvedTickets: 45, pendingTickets: 25 },
  { date: "05/03", newTickets: 55, resolvedTickets: 48, pendingTickets: 32 },
  { date: "06/03", newTickets: 60, resolvedTickets: 52, pendingTickets: 40 },
  { date: "07/03", newTickets: 58, resolvedTickets: 50, pendingTickets: 48 },
  { date: "08/03", newTickets: 62, resolvedTickets: 55, pendingTickets: 55 },
  { date: "09/03", newTickets: 65, resolvedTickets: 60, pendingTickets: 60 },
  { date: "10/03", newTickets: 68, resolvedTickets: 62, pendingTickets: 66 },
  { date: "11/03", newTickets: 70, resolvedTickets: 65, pendingTickets: 71 },
  { date: "12/03", newTickets: 72, resolvedTickets: 68, pendingTickets: 75 },
  { date: "13/03", newTickets: 75, resolvedTickets: 70, pendingTickets: 80 },
  { date: "14/03", newTickets: 78, resolvedTickets: 72, pendingTickets: 86 },
];

// Mock data for resolution time trends
const resolutionTimeTrends = [
  { date: "01/03", firstResponse: 15, resolution: 120 },
  { date: "02/03", firstResponse: 14, resolution: 115 },
  { date: "03/03", firstResponse: 16, resolution: 125 },
  { date: "04/03", firstResponse: 13, resolution: 110 },
  { date: "05/03", firstResponse: 12, resolution: 105 },
  { date: "06/03", firstResponse: 11, resolution: 100 },
  { date: "07/03", firstResponse: 10, resolution: 95 },
  { date: "08/03", firstResponse: 9, resolution: 90 },
  { date: "09/03", firstResponse: 8, resolution: 85 },
  { date: "10/03", firstResponse: 9, resolution: 88 },
  { date: "11/03", firstResponse: 10, resolution: 92 },
  { date: "12/03", firstResponse: 11, resolution: 95 },
  { date: "13/03", firstResponse: 10, resolution: 90 },
  { date: "14/03", firstResponse: 9, resolution: 85 },
];

// Mock data for ticket distribution by day of week
const ticketsByDayOfWeek = [
  { name: "Pazartesi", value: 120 },
  { name: "Salı", value: 115 },
  { name: "Çarşamba", value: 110 },
  { name: "Perşembe", value: 105 },
  { name: "Cuma", value: 100 },
  { name: "Cumartesi", value: 60 },
  { name: "Pazar", value: 40 },
];

// Mock data for ticket distribution by time of day
const ticketsByTimeOfDay = [
  { time: "00:00-02:00", value: 15 },
  { time: "02:00-04:00", value: 10 },
  { time: "04:00-06:00", value: 5 },
  { time: "06:00-08:00", value: 20 },
  { time: "08:00-10:00", value: 80 },
  { time: "10:00-12:00", value: 120 },
  { time: "12:00-14:00", value: 90 },
  { time: "14:00-16:00", value: 110 },
  { time: "16:00-18:00", value: 100 },
  { time: "18:00-20:00", value: 60 },
  { time: "20:00-22:00", value: 30 },
  { time: "22:00-00:00", value: 20 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"];

export function TrendsTab({ loading = false }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="volume" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume">Talep Hacmi</TabsTrigger>
          <TabsTrigger value="resolution">Çözüm Süreleri</TabsTrigger>
          <TabsTrigger value="distribution">Talep Dağılımı</TabsTrigger>
        </TabsList>
        
        {/* Talep Hacmi Tab */}
        <TabsContent value="volume" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                  Talep Hacmi Trendi (Son 14 Gün)
                </div>
              </CardTitle>
              <Badge variant="outline" className="ml-auto">
                Günlük
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ticketVolumeTrends}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="newTickets"
                        name="Yeni Talepler"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolvedTickets"
                        name="Çözülen Talepler"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                      />
                      <Area
                        type="monotone"
                        dataKey="pendingTickets"
                        name="Bekleyen Talepler"
                        stackId="3"
                        stroke="#ffc658"
                        fill="#ffc658"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Günlük Talep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">62</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +8% ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Günlük Çözüm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">56</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +6% ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Çözüm Oranı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">90.3%</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +2% ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Çözüm Süreleri Tab */}
        <TabsContent value="resolution" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  Çözüm Süreleri Trendi (Son 14 Gün)
                </div>
              </CardTitle>
              <Badge variant="outline" className="ml-auto">
                Dakika Cinsinden
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={resolutionTimeTrends}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="firstResponse"
                        name="İlk Yanıt Süresi (dk)"
                        stroke="#8884d8"
                        fill="#8884d8"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolution"
                        name="Çözüm Süresi (dk)"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama İlk Yanıt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">10.5 dk</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    -12% ↓
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Çözüm Süresi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">98 dk</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    -8% ↓
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">SLA Uyum Oranı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">94.7%</p>
                    <p className="text-sm text-muted-foreground">Son 14 gün</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +3% ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Talep Dağılımı Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Haftanın Günlerine Göre Talep Dağılımı
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketsByDayOfWeek}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {ticketsByDayOfWeek.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    Günün Saatlerine Göre Talep Dağılımı
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ticketsByTimeOfDay}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Talep Sayısı" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Talep Dağılımı Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">En Yoğun Gün</h4>
                  <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <span>Pazartesi</span>
                    <span className="font-medium">120 Talep (18.5%)</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">En Yoğun Saat Aralığı</h4>
                  <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <span>10:00 - 12:00</span>
                    <span className="font-medium">120 Talep (18.2%)</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">En Sakin Gün</h4>
                  <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <span>Pazar</span>
                    <span className="font-medium">40 Talep (6.2%)</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">En Sakin Saat Aralığı</h4>
                  <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <span>04:00 - 06:00</span>
                    <span className="font-medium">5 Talep (0.8%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
