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
    LineChart
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast/use-toast";
import { useFilterEventStore } from "@/stores/filter-event-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useRefreshStore, REFRESH_INTERVAL } from "@/stores/refresh-store";
import { useCountdown } from "@/hooks/useCountdown";
import { extractTenantId } from "@/lib/utils";
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
    // Günün saatleri için veri oluştur
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Toplam talep sayısı
    const totalTicketCount = Math.floor(Math.random() * 500) + 300;
    const resolvedTicketCount = Math.floor(totalTicketCount * (Math.random() * 0.3 + 0.6)); // %60-90 arası çözülme oranı
    const pendingTicketCount = totalTicketCount - resolvedTicketCount;
    
    // Saatlik talep istatistikleri
    const ticketStats = hours.map(hour => {
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        const openedTickets = Math.floor(Math.random() * 20) + 5;
        const resolvedTickets = Math.floor(Math.random() * openedTickets) + 3;
        const pendingTickets = openedTickets - resolvedTickets + Math.floor(Math.random() * 5);
        
        return {
            'Saat': hourStr,
            'Açılan Talepler': openedTickets,
            'Çözülen Talepler': resolvedTickets,
            'Bekleyen Talepler': pendingTickets
        };
    });
    
    // Bekleme süreleri
    const waitTimes = hours.map(hour => {
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        return {
            'Saat': hourStr,
            'Atama Süresi (dk)': Math.floor(Math.random() * 30) + 5,
            'Çözüm Süresi (dk)': Math.floor(Math.random() * 120) + 30
        };
    });
    
    // Kategori dağılımı
    const categories = [
        'Teknik Destek', 'Ürün Bilgisi', 'Fatura Sorunu', 
        'İade Talebi', 'Şikayet', 'Öneri', 'Diğer'
    ];
    
    const ticketCategories = categories.map(category => ({
        'Kategori': category,
        'Talep Sayısı': Math.floor(Math.random() * 100) + 20
    }));
    
    // Temsilci performansı
    const agents = [
        'Ahmet Y.', 'Mehmet K.', 'Ayşe S.', 
        'Fatma D.', 'Ali R.', 'Zeynep T.'
    ];
    
    const agentPerformance = agents.map(agent => ({
        'Temsilci': agent,
        'Çözülen Talep': Math.floor(Math.random() * 50) + 10,
        'Ortalama Çözüm Süresi (dk)': Math.floor(Math.random() * 60) + 20,
        'Memnuniyet Puanı': Math.floor(Math.random() * 5) + 3
    }));
    
    return {
        totalTickets: {
            'Toplam Talep': totalTicketCount.toString(),
            'Değişim (Bu Ay)': `+${Math.floor(Math.random() * 20)}%`
        },
        resolvedTickets: {
            'Çözülen Talep': resolvedTicketCount.toString(),
            'Çözüm Oranı': `${Math.floor((resolvedTicketCount / totalTicketCount) * 100)}%`
        },
        pendingTickets: {
            'Bekleyen Talep': pendingTicketCount.toString(),
            'Bekleyen Oranı': `${Math.floor((pendingTicketCount / totalTicketCount) * 100)}%`
        },
        agentPerformance,
        ticketStats,
        waitTimes,
        ticketCategories,
        hourlyTicketStats: ticketStats
    };
};

export default function Analysis() {
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
            const mockData = generateMockData();
            
            // API çağrısı simülasyonu için kısa bir gecikme
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setAnalysisData(mockData);
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
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Hata!",
                description: "Destek merkezi verilerini alırken bir sorun oluştu. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
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
    }, [selectedFilter, activeTab, loading, filterApplied, shouldFetch, setFilterApplied, setShouldFetch]);

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
            // Analiz sekme durumunu kaydet
            wasTabActive.current = true;
            return;
        }

        // Manuel yenileme kontrolü
        if (shouldFetch) {
            fetchData();
            setShouldFetch(false);
            wasTabActive.current = true;
            return;
        }

        // Sekme değişikliği kontrolü - sekme aktifleştiğinde
        if (!wasTabActive.current) {
            fetchData();
            wasTabActive.current = true;
            return;
        }
    }, [activeTab, fetchData, hasFetched, shouldFetch, selectedFilter.appliedAt, setShouldFetch]);

    // Sayfa yüklendiğinde ve filtre değiştiğinde veri çek
    useEffect(() => {
        if (activeTab === "analysis" && wasTabActive.current === true) {
            if (selectedFilter.appliedAt && selectedFilter.appliedAt !== appliedAtRef.current) {
                appliedAtRef.current = selectedFilter.appliedAt;
                fetchData();
            }
        }
    }, [selectedFilter.appliedAt, activeTab, fetchData]);

    // For auto-refresh
    const autoRefreshEnabled = settings.some(s => s.Kod === 'autoRefresh' && s.Value === 'true');
    const isAutoRefreshActive = activeTab === "analysis" && autoRefreshEnabled;
    const countdown = useCountdown(
        REFRESH_INTERVAL / 1000,
        isAutoRefreshActive,
        (value) => {
            if (value === 0) {
                fetchData();
            }
        }
    );

    return (
        <div className="flex flex-col w-full h-full p-4 space-y-4 overflow-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Toplam Talep Kartı */}
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

                {/* Temsilci Performansı Kartı */}
                <Card className="p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Temsilci Performansı</p>
                            <div className="flex items-center">
                                <div className="text-2xl font-bold">
                                    {loadingCards.agentPerformance ? (
                                        <div className="w-16 h-8 bg-muted animate-pulse rounded-md"></div>
                                    ) : (
                                        analysisData?.agentPerformance[0]['Temsilci'] || "0"
                                    )}
                                </div>
                                {!loadingCards.agentPerformance && analysisData?.agentPerformance[0]['Çözülen Talep'] && (
                                    <div className="ml-2 text-xs text-blue-500 flex items-center">
                                        {analysisData.agentPerformance[0]['Çözülen Talep']}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-full">
                            <Users className="w-4 h-4 text-purple-500" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card className="p-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Saatlik Talep İstatistikleri</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loadingCards.ticketStats ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <CallVolumeChart data={analysisData?.hourlyTicketStats || []} />
                        )}
                    </CardContent>
                </Card>

                <Card className="p-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Bekleme ve Çözüm Süreleri</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loadingCards.waitTimes ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <WaitTimeChart data={analysisData?.waitTimes || []} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Kategori Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loadingCards.ticketCategories ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <CategoryDistributionChart data={analysisData?.ticketCategories || []} />
                        )}
                    </CardContent>
                </Card>

                <Card className="p-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Temsilci Performansı</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loadingCards.agentPerformance ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {analysisData?.agentPerformance.map((agent, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Avatar>
                                                <AvatarFallback>{agent.Temsilci.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{agent.Temsilci}</p>
                                                <p className="text-xs text-muted-foreground">Destek Temsilcisi</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{agent['Çözülen Talep']} çözülen talep</p>
                                            <p className="text-xs text-muted-foreground">Ort. {agent['Ortalama Çözüm Süresi (dk)']} dk</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
