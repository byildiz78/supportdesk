"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useFilterStore } from "@/stores/filters-store";
import { useSettingsStore } from "@/stores/settings-store";
import { 
    ArrowUpRight, 
    ChevronRight, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Users, 
    UserCheck, 
    ClipboardList,
    PhoneCall,
    BarChart,
    PieChart,
    LineChart,
    TrendingUp,
    Building
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/stores/tab-store";
import axios, { isAxiosError } from "@/lib/axios";
import { AxiosError } from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast/use-toast";
import { useFilterEventStore } from "@/stores/filter-event-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useRefreshStore } from "@/stores/refresh-store";
import { useCountdown } from "@/hooks/useCountdown";
import { extractTenantId } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import our custom tab components
import { PerformanceTab } from "../components/PerformanceTab";
import { TrendsTab } from "../components/TrendsTab";
import { CustomerInsightsTab } from "../components/CustomerInsightsTab";
import { CallVolumeChart } from "../components/CallVolumeChart";
import { WaitTimeChart } from "../components/WaitTimeChart";
import { CategoryDistributionChart } from "../components/CategoryDistributionChart";

// Define refresh interval constant
const REFRESH_INTERVAL = 60000; // 60 seconds

// Destek merkezi analiz verilerine dair arayüzler
interface AnalysisData {
    totalTickets: {
        'Toplam Talep': string;
        'Değişim (Bu Ay)': string;
    };
    resolvedTickets: {
        'Çözülen Talep': string;
        'Çözüm Oranı': string;
    };
    pendingTickets: {
        'Bekleyen Talep': string;
        'Bekleyen Oranı': string;
    };
    agentPerformance: {
        'Temsilci': string;
        'Çözülen Talep': number;
        'Ortalama Çözüm Süresi (dk)': number;
        'Memnuniyet Puanı': number;
    }[];
    ticketStats: {
        'Saat': string;
        'Açılan Talepler': number;
        'Çözülen Talepler': number;
        'Bekleyen Talepler': number;
    }[];
    waitTimes: {
        'Saat': string;
        'Atama Süresi (dk)': number;
        'Çözüm Süresi (dk)': number;
    }[];
    ticketCategories: {
        'Kategori': string;
        'Talep Sayısı': number;
    }[];
    hourlyTicketStats: {
        'Saat': string;
        'Açılan Talepler': number;
        'Çözülen Talepler': number;
        'Bekleyen Talepler': number;
    }[];
}

// Mock veri oluşturan yardımcı fonksiyon
const generateMockData = (): AnalysisData => {
    // Agent performance data
    const agentPerformance = [
        {
            'Temsilci': 'Ahmet Yılmaz',
            'Çözülen Talep': 87,
            'Ortalama Çözüm Süresi (dk)': 42,
            'Memnuniyet Puanı': 4.8
        },
        {
            'Temsilci': 'Ayşe Demir',
            'Çözülen Talep': 64,
            'Ortalama Çözüm Süresi (dk)': 38,
            'Memnuniyet Puanı': 4.6
        },
        {
            'Temsilci': 'Mehmet Kaya',
            'Çözülen Talep': 92,
            'Ortalama Çözüm Süresi (dk)': 35,
            'Memnuniyet Puanı': 4.9
        },
        {
            'Temsilci': 'Zeynep Şahin',
            'Çözülen Talep': 71,
            'Ortalama Çözüm Süresi (dk)': 45,
            'Memnuniyet Puanı': 4.5
        },
        {
            'Temsilci': 'Can Öztürk',
            'Çözülen Talep': 58,
            'Ortalama Çözüm Süresi (dk)': 50,
            'Memnuniyet Puanı': 4.3
        }
    ];

    // Hourly ticket statistics
    const ticketStats = Array.from({ length: 24 }, (_, i) => {
        const hour = i < 10 ? `0${i}:00` : `${i}:00`;
        const newTickets = Math.floor(Math.random() * 20) + 5;
        const resolvedTickets = Math.floor(Math.random() * newTickets) + 5;
        const pendingTickets = Math.floor(Math.random() * 10) + 2;
        
        return {
            'Saat': hour,
            'Açılan Talepler': newTickets,
            'Çözülen Talepler': resolvedTickets,
            'Bekleyen Talepler': pendingTickets
        };
    });

    // Wait times
    const waitTimes = Array.from({ length: 24 }, (_, i) => {
        const hour = i < 10 ? `0${i}:00` : `${i}:00`;
        
        return {
            'Saat': hour,
            'Atama Süresi (dk)': Math.floor(Math.random() * 15) + 5,
            'Çözüm Süresi (dk)': Math.floor(Math.random() * 60) + 30
        };
    });

    // Category distribution
    const ticketCategories = [
        {
            'Kategori': 'Teknik Sorun',
            'Talep Sayısı': 245
        },
        {
            'Kategori': 'Ürün Bilgisi',
            'Talep Sayısı': 187
        },
        {
            'Kategori': 'Fatura',
            'Talep Sayısı': 132
        },
        {
            'Kategori': 'Şikayet',
            'Talep Sayısı': 98
        },
        {
            'Kategori': 'Öneri',
            'Talep Sayısı': 76
        }
    ];

    return {
        totalTickets: {
            'Toplam Talep': '738',
            'Değişim (Bu Ay)': '12.5'
        },
        resolvedTickets: {
            'Çözülen Talep': '652',
            'Çözüm Oranı': '88.3%'
        },
        pendingTickets: {
            'Bekleyen Talep': '86',
            'Bekleyen Oranı': '11.7%'
        },
        agentPerformance,
        ticketStats,
        waitTimes,
        ticketCategories,
        hourlyTicketStats: ticketStats
    };
};

export default function EnhancedAnalysis() {
    const pathname = usePathname();
    const tenantId = extractTenantId(pathname) ?? "";
    const { selectedFilter } = useFilterStore();
    const { activeTab } = useTabStore();
    const { setFilterApplied, filterApplied } = useFilterEventStore();
    const dashboardStore = useDashboardStore();
    const refreshStore = useRefreshStore();
    const [loading, setLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [loadingCards, setLoadingCards] = useState({
        ticketStats: true,
        waitTimes: true,
        agentPerformance: true,
        ticketCategories: true,
        resolvedTickets: true,
        pendingTickets: true
    });

    // Define shouldFetch and setShouldFetch for this component
    const [shouldFetch, setShouldFetch] = useState(false);
    // Define autoRefresh and refreshInterval for this component
    const [autoRefresh, setAutoRefresh] = useState(false);
    const refreshInterval = REFRESH_INTERVAL;

    const fetchData = useCallback(async () => {
        if (loading) return;

        try {
            setLoading(true);

            setLoadingCards({
                ticketStats: true,
                waitTimes: true,
                agentPerformance: true,
                ticketCategories: true,
                resolvedTickets: true,
                pendingTickets: true
            });
            
            // Gerçek API çağrısı yerine mock veri kullanıyoruz
            // Gerçek implementasyonda bu kısım axios ile API'ye istek atacak şekilde değiştirilmeli
            // API endpoint: /supportdesk/api/main/analysis/getAnalysisData
            
            const response = await axios.get(`/supportdesk/api/main/analysis/getAnalysisData`, {
                params: {
                    tenantId,
                    ...selectedFilter
                }
            });
            const data = response.data;
            
            // Mock veri için
            // const mockData = generateMockData();
            
            // API çağrısı simülasyonu için kısa bir gecikme
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setAnalysisData(data);
            setHasFetched(true);
            if (filterApplied) setFilterApplied(false);
            if (shouldFetch) setShouldFetch(false);

            setLoadingCards({
                ticketStats: false,
                waitTimes: false,
                agentPerformance: false,
                ticketCategories: false,
                resolvedTickets: false,
                pendingTickets: false
            });
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("Axios error:", axiosError);
                toast({
                    title: "Hata!",
                    description: axiosError.message,
                    variant: "destructive",
                });
            } else {
                console.error("Unknown error:", error);
                toast({
                    title: "Hata!",
                    description: "Destek merkezi verilerini alırken bir sorun oluştu. Lütfen tekrar deneyin.",
                    variant: "destructive",
                });
            }
            setLoadingCards({
                ticketStats: false,
                waitTimes: false,
                agentPerformance: false,
                ticketCategories: false,
                resolvedTickets: false,
                pendingTickets: false
            });
        } finally {
            setLoading(false);
        }
    }, [selectedFilter, activeTab, loading, filterApplied, shouldFetch, setFilterApplied, tenantId]);

    // Filtre değiştiğinde veya sayfa yüklendiğinde veri çek
    useEffect(() => {
        if (filterApplied || shouldFetch || !hasFetched) {
            fetchData();
        }
    }, [fetchData, filterApplied, shouldFetch, hasFetched]);

    // Otomatik yenileme için
    const countdown = useCountdown(refreshInterval, autoRefresh, (value) => {
        if (value === 0) {
            fetchData();
        }
    });
    
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        
        if (autoRefresh) {
            intervalId = setInterval(() => {
                fetchData();
            }, refreshInterval);
        }
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoRefresh, refreshInterval, fetchData]);

    return (
        <div className="flex flex-col space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gelişmiş Analiz</h1>
                <div className="flex items-center space-x-2">
                    {autoRefresh && (
                        <div className="text-sm text-muted-foreground">
                            {Math.ceil(countdown / 1000)} saniye sonra yenilenecek
                        </div>
                    )}
                </div>
            </div>
            
            {/* Üst Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Toplam Talepler
                        </CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loadingCards.ticketStats ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {analysisData?.totalTickets['Toplam Talep'] || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center">
                                    <span className={`mr-1 ${parseFloat(analysisData?.totalTickets['Değişim (Bu Ay)'] || '0') > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {parseFloat(analysisData?.totalTickets['Değişim (Bu Ay)'] || '0') > 0 ? '+' : ''}
                                        {analysisData?.totalTickets['Değişim (Bu Ay)'] || '0'}%
                                    </span>
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span className="ml-1">bu ay</span>
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Çözülen Talepler
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loadingCards.resolvedTickets ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {analysisData?.resolvedTickets['Çözülen Talep'] || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Çözüm Oranı: {analysisData?.resolvedTickets['Çözüm Oranı'] || '0%'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Bekleyen Talepler
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loadingCards.pendingTickets ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {analysisData?.pendingTickets['Bekleyen Talep'] || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Bekleyen Oranı: {analysisData?.pendingTickets['Bekleyen Oranı'] || '0%'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="performance">
                        <BarChart className="h-4 w-4 mr-2" />
                        Performans Analizi
                    </TabsTrigger>
                    <TabsTrigger value="trends">
                        <LineChart className="h-4 w-4 mr-2" />
                        Trend Analizi
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                        <Building className="h-4 w-4 mr-2" />
                        Müşteri Analizi
                    </TabsTrigger>
                </TabsList>
                
                {/* Performans Tab */}
                <TabsContent value="performance" className="mt-6">
                    <PerformanceTab />
                </TabsContent>
                
                {/* Trend Analizi Tab */}
                <TabsContent value="trends" className="mt-6">
                    <TrendsTab />
                </TabsContent>
                
                {/* Müşteri Analizi Tab */}
                <TabsContent value="customers" className="mt-6">
                    <CustomerInsightsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
