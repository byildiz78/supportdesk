"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart, RadarChart } from "recharts";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         Pie, Cell, Line, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useFilterStore } from "@/stores/filters-store";
import { usePathname } from "next/navigation";
import axios, { isAxiosError } from "@/lib/axios";
import { AxiosError } from "axios";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast/use-toast";
import { Badge } from "@/components/ui/badge";
import { Users, Building, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerInsightsData {
  topCustomersByTickets: {
    name: string;
    tickets: number;
    satisfaction: number;
  }[];
  ticketCategoriesByCustomer: {
    customer: string;
    categories: {
      name: string;
      count: number;
    }[];
  }[];
  customerSatisfactionTrends: {
    month: string;
    [key: string]: string | number;
  }[];
  customerSegmentDistribution: {
    name: string;
    value: number;
  }[];
  customerPerformanceComparison: {
    customer: string;
    metrics: {
      metric: string;
      value: number;
    }[];
  }[];
}

export function CustomerInsightsTab() {
  const pathname = usePathname();
  const tenantId = pathname?.split("/")[1] || "";
  const { selectedFilter } = useFilterStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerInsightsData | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/supportdesk/api/main/analysis/getCustomerInsights`, {
        params: {
          tenantId,
          ...selectedFilter
        }
      });
      
      setData(response.data);
      
      // Set the first customer as selected by default
      if (response.data.topCustomersByTickets.length > 0) {
        setSelectedCustomer(response.data.topCustomersByTickets[0].name);
      }
      
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error("API error:", error);
        toast({
          title: "Hata!",
          description: error.message || "Müşteri verileri alınamadı.",
          variant: "destructive",
        });
      } else {
        console.error("Unknown error:", error);
        toast({
          title: "Hata!",
          description: "Müşteri verileri alınamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Veri bulunamadı.</p>
      </div>
    );
  }

  // Find the selected customer's data for the radar chart
  const selectedCustomerData = data.customerPerformanceComparison.find(
    item => item.customer === selectedCustomer
  );

  // Format radar data for the selected customer
  const radarData = selectedCustomerData?.metrics.map(item => ({
    subject: item.metric,
    A: item.value,
    fullMark: 150
  })) || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Müşteri Genel Bakış</TabsTrigger>
          <TabsTrigger value="categories">Kategori Dağılımı</TabsTrigger>
          <TabsTrigger value="satisfaction">Memnuniyet Analizi</TabsTrigger>
        </TabsList>
        
        {/* Müşteri Genel Bakış Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-blue-500" />
                  En Çok Talep Oluşturan Müşteriler
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
                      <TableHead>Müşteri</TableHead>
                      <TableHead className="text-right">Talep Sayısı</TableHead>
                      <TableHead className="text-right">Ort. Çözüm Süresi (dk)</TableHead>
                      <TableHead className="text-right">Memnuniyet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topCustomersByTickets.map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right">{customer.tickets}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">{customer.satisfaction.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Segmenti Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.customerSegmentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.customerSegmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Performans Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} />
                      <Radar
                        name="ABC Holding"
                        dataKey="A"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Kategori Dağılımı Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <BarChartIcon className="mr-2 h-5 w-5 text-blue-500" />
                  Müşterilere Göre Talep Kategorileri
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
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.ticketCategoriesByCustomer}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="customer" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {data.ticketCategoriesByCustomer.map((customer, index) => (
                        <Bar
                          key={customer.customer}
                          dataKey={customer.customer}
                          name={customer.customer}
                          stackId="a"
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>En Çok Talep Edilen Kategoriler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ticketCategoriesByCustomer.map((customer, index) => {
                    const total = customer.categories.reduce((acc, category) => acc + category.count, 0);
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{customer.customer}</span>
                          <span className="text-sm text-muted-foreground">{total} talep</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${(total / 300) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bazlı Kategori Analizi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topCustomersByTickets.slice(0, 3).map((customer, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">{customer.name}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>En Çok: Teknik Sorun</span>
                          <span className="font-medium">{index === 0 ? "95" : index === 1 ? "75" : "60"} talep</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>En Az: Fatura</span>
                          <span className="font-medium">{index === 0 ? "30" : index === 1 ? "25" : "20"} talep</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Memnuniyet Analizi Tab */}
        <TabsContent value="satisfaction" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium">
                <div className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-blue-500" />
                  Müşteri Memnuniyet Trendi
                </div>
              </CardTitle>
              <Badge variant="outline" className="ml-auto">
                Son 3 Ay
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
                    <BarChart
                      data={data.customerSatisfactionTrends}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[3.5, 5]} />
                      <Tooltip />
                      <Legend />
                      {data.topCustomersByTickets.slice(0, 3).map((customer, index) => (
                        <Bar
                          key={customer.name}
                          dataKey={customer.name}
                          name={customer.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Memnuniyet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">4.6 / 5.0</p>
                    <p className="text-sm text-muted-foreground">Tüm müşteriler</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +0.2 ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Yüksek Memnuniyet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">4.8 / 5.0</p>
                    <p className="text-sm text-muted-foreground">Mega İnşaat</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +0.1 ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Düşük Memnuniyet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">4.3 / 5.0</p>
                    <p className="text-sm text-muted-foreground">Delta Sağlık</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    +0.2 ↑
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Memnuniyet Faktörleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Çözüm Hızı</h4>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Memnuniyet Etkisi</span>
                    <span className="text-xs font-medium">85%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">İletişim Kalitesi</h4>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Memnuniyet Etkisi</span>
                    <span className="text-xs font-medium">92%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Çözüm Kalitesi</h4>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Memnuniyet Etkisi</span>
                    <span className="text-xs font-medium">90%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Takip Süreci</h4>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Memnuniyet Etkisi</span>
                    <span className="text-xs font-medium">78%</span>
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
