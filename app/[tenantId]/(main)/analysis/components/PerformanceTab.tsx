"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { UserCheck, Award, TrendingUp } from "lucide-react";

// Mock data for agent performance
const agentPerformanceData = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    avatar: "/avatars/01.png",
    resolvedTickets: 87,
    avgResolutionTime: 42,
    satisfactionScore: 4.8,
    trend: "+12%",
  },
  {
    id: 2,
    name: "Ayşe Demir",
    avatar: "/avatars/02.png",
    resolvedTickets: 64,
    avgResolutionTime: 38,
    satisfactionScore: 4.6,
    trend: "+8%",
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    avatar: "/avatars/03.png",
    resolvedTickets: 92,
    avgResolutionTime: 35,
    satisfactionScore: 4.9,
    trend: "+15%",
  },
  {
    id: 4,
    name: "Zeynep Şahin",
    avatar: "/avatars/04.png",
    resolvedTickets: 71,
    avgResolutionTime: 45,
    satisfactionScore: 4.5,
    trend: "+5%",
  },
  {
    id: 5,
    name: "Can Öztürk",
    avatar: "/avatars/05.png",
    resolvedTickets: 58,
    avgResolutionTime: 50,
    satisfactionScore: 4.3,
    trend: "+3%",
  },
];

// Mock data for performance metrics over time
const performanceMetricsData = [
  { month: "Ocak", avgResolutionTime: 55, satisfactionScore: 4.2, resolvedTickets: 320 },
  { month: "Şubat", avgResolutionTime: 50, satisfactionScore: 4.3, resolvedTickets: 350 },
  { month: "Mart", avgResolutionTime: 48, satisfactionScore: 4.4, resolvedTickets: 380 },
  { month: "Nisan", avgResolutionTime: 45, satisfactionScore: 4.5, resolvedTickets: 400 },
  { month: "Mayıs", avgResolutionTime: 42, satisfactionScore: 4.6, resolvedTickets: 420 },
  { month: "Haziran", avgResolutionTime: 40, satisfactionScore: 4.7, resolvedTickets: 450 },
];

// Mock data for team performance comparison
const teamPerformanceData = [
  { name: "Teknik Destek", resolvedTickets: 450, avgResolutionTime: 38, satisfactionScore: 4.7 },
  { name: "Müşteri Hizmetleri", resolvedTickets: 380, avgResolutionTime: 42, satisfactionScore: 4.5 },
  { name: "Ürün Destek", resolvedTickets: 320, avgResolutionTime: 45, satisfactionScore: 4.4 },
  { name: "Satış Sonrası", resolvedTickets: 290, avgResolutionTime: 48, satisfactionScore: 4.3 },
];

export function PerformanceTab({ loading = false }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Temsilci Performansı</TabsTrigger>
          <TabsTrigger value="trends">Performans Trendleri</TabsTrigger>
          <TabsTrigger value="teams">Takım Performansı</TabsTrigger>
        </TabsList>
        
        {/* Temsilci Performansı Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5 text-blue-500" />
                  Temsilci Performans Sıralaması
                </div>
              </CardTitle>
              <Badge variant="outline" className="ml-auto">
                Son 30 Gün
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Temsilci</TableHead>
                      <TableHead className="text-right">Çözülen Talepler</TableHead>
                      <TableHead className="text-right">Ort. Çözüm Süresi (dk)</TableHead>
                      <TableHead className="text-right">Memnuniyet Puanı</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformanceData.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={agent.avatar} alt={agent.name} />
                              <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {agent.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{agent.resolvedTickets}</TableCell>
                        <TableCell className="text-right">{agent.avgResolutionTime}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">{agent.satisfactionScore}</span>
                            <Award className="h-4 w-4 text-yellow-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-500">
                          <div className="flex items-center justify-end">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {agent.trend}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Hızlı Çözüm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="/avatars/03.png" alt="Mehmet Kaya" />
                    <AvatarFallback>MK</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Mehmet Kaya</p>
                    <p className="text-sm text-muted-foreground">Ort. 35 dakika</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Çok Çözüm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="/avatars/03.png" alt="Mehmet Kaya" />
                    <AvatarFallback>MK</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Mehmet Kaya</p>
                    <p className="text-sm text-muted-foreground">92 talep çözüldü</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Yüksek Memnuniyet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src="/avatars/03.png" alt="Mehmet Kaya" />
                    <AvatarFallback>MK</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Mehmet Kaya</p>
                    <p className="text-sm text-muted-foreground">4.9 / 5.0 puan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performans Trendleri Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Performans Trendleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceMetricsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgResolutionTime"
                      name="Ort. Çözüm Süresi (dk)"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="satisfactionScore"
                      name="Memnuniyet Puanı"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Aylık Çözülen Talep Sayısı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceMetricsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolvedTickets" name="Çözülen Talepler" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Takım Performansı Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Takım Performans Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamPerformanceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolvedTickets" name="Çözülen Talepler" fill="#3b82f6" />
                    <Bar dataKey="avgResolutionTime" name="Ort. Çözüm Süresi (dk)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamPerformanceData.map((team, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Çözülen Talepler:</span>
                      <span className="font-medium">{team.resolvedTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ort. Çözüm Süresi:</span>
                      <span className="font-medium">{team.avgResolutionTime} dk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memnuniyet Puanı:</span>
                      <span className="font-medium">{team.satisfactionScore} / 5.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
