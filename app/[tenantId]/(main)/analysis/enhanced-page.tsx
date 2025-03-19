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
import { useRefreshStore, REFRESH_INTERVAL } from "@/stores/refresh-store";
import { useCountdown } from "@/hooks/useCountdown";
import { extractTenantId } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import our custom tab components
import { PerformanceTab } from "./components/PerformanceTab";
import { TrendsTab } from "./components/TrendsTab";
import { CustomerInsightsTab } from "./components/CustomerInsightsTab";
import { CallVolumeChart } from "./components/CallVolumeChart";
import { WaitTimeChart } from "./components/WaitTimeChart";
import { CategoryDistributionChart } from "./components/CategoryDistributionChart";

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
    // Temsilci performans verileri
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

    // Saatlik talep istatistikleri
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

    // Bekleme süreleri
    const waitTimes = Array.from({ length: 24 }, (_, i) => {
        const hour = i < 10 ? `0${i}:00` : `${i}:00`;
        
        return {
            'Saat': hour,
            'Atama Süresi (dk)': Math.floor(Math.random() * 15) + 5,
            'Çözüm Süresi (dk)': Math.floor(Math.random() * 60) + 30
        };
    });

    // Kategori dağılımı
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
    const { activeTab } = useTabStore();
    const { selectedFilter, setFilter } = useFilterStore();
    const { settings } = useSettingsStore();
    const pathname = usePathname();
    const tenantId = pathname ? extractTenantId(pathname) : "";
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingCards, setLoadingCards] = useState({
        ticketStats: false,
        waitTimes: false,
        agentPerformance: false,
        ticketCategories: false,
        resolvedTickets: false,
        pendingTickets: false
    });

    const [hasFetched, setHasFetched] = useState(false);
    const { filterApplied, setFilterApplied } = useFilterEventStore();
    const { setShouldFetch, shouldFetch } = useRefreshStore();
    const appliedAtRef = useRef(selectedFilter.appliedAt);
    const wasTabActive = useRef(false);

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
    }, [selectedFilter, activeTab, loading, filterApplied, shouldFetch, setFilterApplied, setShouldFetch, tenantId]);

    useEffect(() => {
        // Analiz sekmesi aktif değilse
        if (activeTab !== "analysis") {
            // Analiz sekme durumunu kaydet
            wasTabActive.current = false;
            return;
        }

        // Analiz sekmesi aktifse ve daha önce veri çekilmediyse - ilk yükleme
        if (!hasFetched) {
            fetchData();
            setHasFetched(true);
            // Filtre uygulama zamanını kaydet
            appliedAtRef.current = selectedFilter.appliedAt;
            wasTabActive.current = true;
            return;
        }

        // Analiz sekmesi aktifse ve filtre değiştiyse
        if (selectedFilter.appliedAt !== appliedAtRef.current) {
            fetchData();
            // Filtre uygulama zamanını güncelle
            appliedAtRef.current = selectedFilter.appliedAt;
        }

        // Analiz sekmesi aktifse ve daha önce aktif değilse - sekme değişimi
        if (!wasTabActive.current) {
            fetchData();
            wasTabActive.current = true;
        }

        // Yenileme isteği varsa
        if (shouldFetch) {
            fetchData();
        }
    }, [activeTab, hasFetched, selectedFilter.appliedAt, shouldFetch, fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Destek Merkezi Analizi</h2>
            </div>

            {/* Ana Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Toplam Talepler Kartı */}
                <Card className="p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Toplam Talep</p>
                            <div className="flex items-center">
                                <div className="text-2xl font-bold">
                                    {loadingCards.ticketStats ? (
                                        <div className="w-16 h-8 bg-muted animate-pulse rounded-md"></div>
                                    ) : (
                                        analysisData?.totalTickets['Toplam Talep'] || "0"
                                    )}
                                </div>
                                {!loadingCards.ticketStats && analysisData?.totalTickets['Değişim (Bu Ay)'] && (
                                    <div className="ml-2 text-xs text-green-500 flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        {analysisData.totalTickets['Değişim (Bu Ay)']}%
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <ClipboardList className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                </Card>

                {/* Çözülen Talepler Kartı */}
                <Card className="p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Çözülen Talepler</p>
                            <div className="flex items-center">
                                <div className="text-2xl font-bold">
                                    {loadingCards.resolvedTickets ? (
                                        <div className="w-16 h-8 bg-muted animate-pulse rounded-md"></div>
                                    ) : (
                                        analysisData?.resolvedTickets['Çözülen Talep'] || "0"
                                    )}
                                </div>
                                {!loadingCards.resolvedTickets && analysisData?.resolvedTickets['Çözüm Oranı'] && (
                                    <div className="ml-2 text-xs text-green-500 flex items-center">
                                        {analysisData.resolvedTickets['Çözüm Oranı']}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                    </div>
                </Card>

                {/* Bekleyen Talepler Kartı */}
                <Card className="p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Bekleyen Talepler</p>
                            <div className="flex items-center">
                                <div className="text-2xl font-bold">
                                    {loadingCards.pendingTickets ? (
                                        <div className="w-16 h-8 bg-muted animate-pulse rounded-md"></div>
                                    ) : (
                                        analysisData?.pendingTickets['Bekleyen Talep'] || "0"
                                    )}
                                </div>
                                {!loadingCards.pendingTickets && analysisData?.pendingTickets['Bekleyen Oranı'] && (
                                    <div className="ml-2 text-xs text-red-500 flex items-center">
                                        {analysisData.pendingTickets['Bekleyen Oranı']}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                </Card>

                {/* Ortalama Çözüm Süresi Kartı */}
                <Card className="p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Ort. Çözüm Süresi</p>
                            <div className="flex items-center">
                                <div className="text-2xl font-bold">
                                    {loadingCards.waitTimes ? (
                                        <div className="w-16 h-8 bg-muted animate-pulse rounded-md"></div>
                                    ) : (
                                        "45 dk"
                                    )}
                                </div>
                                <div className="ml-2 text-xs text-green-500 flex items-center">
                                    <ArrowUpRight className="w-3 h-3 mr-1 rotate-180" />
                                    8%
                                </div>
                            </div>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Ana Analiz Tabları */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="performance">Performans</TabsTrigger>
                    <TabsTrigger value="trends">Trend Analizi</TabsTrigger>
                    <TabsTrigger value="customers">Müşteri Analizi</TabsTrigger>
                </TabsList>
                
                {/* Genel Bakış Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Talep Hacmi Grafiği */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-md font-medium">
                                    <div className="flex items-center">
                                        <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                                        Talep Hacmi
                                    </div>
                                </CardTitle>
                                <Badge variant="outline" className="ml-auto">
                                    Saatlik
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                {loadingCards.ticketStats ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <CallVolumeChart data={analysisData?.ticketStats || []} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Bekleme Süreleri Grafiği */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-md font-medium">
                                    <div className="flex items-center">
                                        <Clock className="mr-2 h-5 w-5 text-blue-500" />
                                        Bekleme Süreleri
                                    </div>
                                </CardTitle>
                                <Badge variant="outline" className="ml-auto">
                                    Saatlik
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                {loadingCards.waitTimes ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <WaitTimeChart data={analysisData?.waitTimes || []} />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kategori Dağılımı Grafiği */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-md font-medium">
                                    <div className="flex items-center">
                                        <PieChart className="mr-2 h-5 w-5 text-blue-500" />
                                        Kategori Dağılımı
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingCards.ticketCategories ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <CategoryDistributionChart data={analysisData?.ticketCategories || []} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Temsilci Performansı Tablosu */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-md font-medium">
                                    <div className="flex items-center">
                                        <UserCheck className="mr-2 h-5 w-5 text-blue-500" />
                                        Temsilci Performansı
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingCards.agentPerformance ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {analysisData?.agentPerformance.slice(0, 3).map((agent, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <Avatar className="h-8 w-8 mr-2">
                                                        <AvatarFallback>{agent['Temsilci'].charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{agent['Temsilci']}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {agent['Çözülen Talep']} talep çözüldü
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {agent['Memnuniyet Puanı']} / 5.0
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-sm text-muted-foreground text-center pt-2">
                                            <a href="#" className="flex items-center justify-center">
                                                Tümünü Gör <ChevronRight className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
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
