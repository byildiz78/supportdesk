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
    ClipboardList 
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/stores/tab-store";
import axios, { isAxiosError } from "@/lib/axios";
import { AxiosError } from "axios";
import { Card } from "@/components/ui/card";
import { TicketTrendsChart } from "./components/TicketTrendsChart"; // Bu componenti oluşturmanız gerekebilir
import { toast } from "@/components/ui/toast/use-toast";
import { useFilterEventStore } from "@/stores/filter-event-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useRefreshStore, REFRESH_INTERVAL } from "@/stores/refresh-store";
import { useCountdown } from "@/hooks/useCountdown";
import { extractTenantId } from "@/lib/utils";

// Destek merkezi dashboard verilerine dair arayüzler
interface RecentTicket {
    TicketID: string;
    Subject: string;
    Status: string;
    CreatedAt: string;
    Priority: string;
}

interface DashboardData {
    totalTickets: {
        'Toplam Talep': string;
        'Değişim (Bu Ay)': string;
    };
    openTickets: {
        'Açık Talepler': string;
        'Bekleyen Sayısı': string;
    };
    resolvedToday: {
        'Bugün Çözülen': string;
        'Çözüm Oranı': string;
    };
    activeAgents: {
        'Aktif Temsilci': string;
        'Müsait Temsilci': string;
    };
    recentTickets: RecentTicket[];
    ticketStats: {
        'Gün': string;
        'Açılan Talepler': string;
        'Çözülen Talepler': string;
        'Ortalama Çözüm Süresi': string;
    }[];
}

export default function Dashboard() {
    const { activeTab } = useTabStore();
    const { selectedFilter, setFilter } = useFilterStore();
    const { settings } = useSettingsStore();
    const pathname = usePathname();
    const currentDate = new Date().toISOString().split('T')[0];
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingCards, setLoadingCards] = useState({
        totalTickets: false,
        openTickets: false,
        resolvedToday: false,
        activeAgents: false,
        trendsChart: false,
        recentTickets: false,
    });

    const [hasFetched, setHasFetched] = useState(false);
    const [localDateFilter, setLocalDateFilter] = useState(selectedFilter.date);
    // Seçilen firma/şube bilgisini tutacak local state
    const [localTenantInfo, setLocalTenantInfo] = useState("");
    const { setIsDashboardTab } = useDashboardStore();
    const { filterApplied, setFilterApplied } = useFilterEventStore();
    const { setShouldFetch, shouldFetch } = useRefreshStore();
    const appliedAtRef = useRef(selectedFilter.appliedAt);
    const wasTabActive = useRef(false);
    const hasResetBranches = useRef(false);
    const shouldResetBranches = useRef(false);


    const fetchData = useCallback(async () => {
 

        if (loading) return;

        try {
            setLoading(true);

            setLoadingCards({
                totalTickets: true,
                openTickets: true,
                resolvedToday: true,
                activeAgents: true,
                trendsChart: true,
                recentTickets: true,
            });
            
            const response = await axios.post<DashboardData>(
                "/supportdesk/api/main/dashboard/getDashboardData",
                {
                    date1: selectedFilter.date.from,
                    date2: selectedFilter.date.to,
                },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            setDashboardData(response.data);
            setHasFetched(true);
            if (filterApplied) setFilterApplied(false);
            if (shouldFetch) setShouldFetch(false);

            setLoadingCards({
                totalTickets: false,
                openTickets: false,
                resolvedToday: false,
                activeAgents: false,
                trendsChart: false,
                recentTickets: false,
            });
        } catch (error: unknown) {
            console.error("Error fetching data:", error);
            if (isAxiosError(error) && error.response && error.response.status === 404) {
                toast({
                    title: "Bilgi",
                    description: "Destek merkezi verileri bulunamadı. Lütfen daha sonra tekrar deneyin.",
                    variant: "default",
                });
            } else {
                toast({
                    title: "Hata!",
                    description: "Destek merkezi verilerini alırken bir sorun oluştu. Lütfen tekrar deneyin.",
                    variant: "destructive",
                });
            }
            setLoadingCards({
                totalTickets: false,
                openTickets: false,
                resolvedToday: false,
                activeAgents: false,
                trendsChart: false,
                recentTickets: false,
            });
        } finally {
            setLoading(false);
        }
    }, [selectedFilter, activeTab, loading, filterApplied, shouldFetch, setFilterApplied, setShouldFetch, setFilter]);

    useEffect(() => {
        // Yalnızca dashboard sekmesi şu anda aktifken ve daha önce de aktifse filtre değişikliklerini işle
        // Bu wasTabActive kontrolü, sekme değişikliğinde bu useEffect'in tetiklenmesini engeller
        if (activeTab === "dashboard" && wasTabActive.current === true) {
            // Filtre değişikliği olduysa ve bu değişiklik önceki değerlenmemiş değişiklikse
            if (selectedFilter.appliedAt && selectedFilter.appliedAt !== appliedAtRef.current) {
                // Uygulama zamanını güncelle
                appliedAtRef.current = selectedFilter.appliedAt;

                // Veri çek
                fetchData();
            }
        }
    }, [selectedFilter.appliedAt, activeTab, fetchData]);

    useEffect(() => {
        // Dashboard sekmesi aktif değilse
        if (activeTab !== "dashboard") {
            // Dashboard sekme durumunu kaydet
            wasTabActive.current = false;
            return;
        }

        // Dashboard sekmesi aktifse ve daha önce veri çekilmediyse - ilk yükleme
        if (!hasFetched) {
            fetchData();
            setHasFetched(true);
            // Filtre uygulama zamanını kaydet
            appliedAtRef.current = selectedFilter.appliedAt;
            // Dashboard sekme durumunu kaydet
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

        // Sekme geçişi testi: eğer önceden aktif değilse ve şimdi aktifse,
        // bu sekme geçişi demektir - API isteği yapmadan yalnızca flag'i güncelle
        if (!wasTabActive.current) {
            console.log("Dashboard sekmesine geçiş tespit edildi, veri zaten yüklü olduğu için yeni API isteği yapılmıyor");
            wasTabActive.current = true;
        }
    }, [activeTab, fetchData, shouldFetch, hasFetched, setShouldFetch, selectedFilter.appliedAt, selectedFilter.branches, selectedFilter.selectedBranches]);

    useEffect(() => {
        if (filterApplied && activeTab === "dashboard") {
            setLocalDateFilter(selectedFilter.date);
        }
    }, [filterApplied, selectedFilter.date, activeTab]);

    useEffect(() => {
        setIsDashboardTab(activeTab === "dashboard");
    }, [activeTab, setIsDashboardTab]);

    const handleCountdownTick = useCallback((value: number) => {
        if (value === 5) {
            setShouldFetch(true);
        }
    }, [setShouldFetch]);

    const count = useCountdown(
        REFRESH_INTERVAL / 1000,
        activeTab === "dashboard",
        handleCountdownTick
    );

    useEffect(() => {
        // Sekme değiştiğinde veya yeni bir filtre uygulandığında sıfırlama bayrağını sıfırla
        if (activeTab !== "dashboard" || filterApplied) {
            hasResetBranches.current = false;
        }

        // Eğer dashboard sekmesindeyiz ve şube seçimi yapılmışsa
        // ve henüz şubeler sıfırlanmamışsa, sıfırlama işlemini başlat
        // Ancak sadece shouldResetBranches true ise
        if (activeTab === "dashboard" &&
            selectedFilter.selectedBranches.length > 0 &&
            !hasResetBranches.current &&
            !loading &&
            hasFetched &&
            shouldResetBranches.current) {

            hasResetBranches.current = true;

            // En güncel filtreyi alalım
            const latestFilter = JSON.parse(JSON.stringify(selectedFilter));
            const newFilter = { ...latestFilter, selectedBranches: [] };

            // Filtreleri temizle
            setFilter(newFilter);
            // Şube sıfırlama işlemi tamamlandı, bayrağı sıfırla
            shouldResetBranches.current = false;
        }
    }, [activeTab, filterApplied, selectedFilter.selectedBranches, loading, hasFetched, setFilter]);

    return (
        <div className="h-full flex">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                <div className="flex justify-between items-center py-3 px-3 bg-background/95 backdrop-blur-sm border-b border-border/60 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Destek Merkezi
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg px-3 py-2 text-sm text-muted-foreground text-start flex items-center gap-2 group">
                            <div className="duration-[8000ms] text-blue-500 group-hover:text-blue-600 [animation:spin_6s_linear_infinite]">
                                <svg
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 22h14" />
                                    <path d="M5 2h14" />
                                    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                                    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                                </svg>
                            </div>
                            <span className="font-medium w-4 text-center">{count}</span>
                            <span>saniye</span>
                        </div>
                    </div>
                </div>

                <div className="p-3 space-y-4 md:space-y-6 pb-20">

                    {/* Summary Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Toplam Talepler */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" />
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Talepler</p>
                                        {loadingCards.totalTickets ? (
                                            <div className="h-8 mt-1 flex items-center">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span className="text-muted-foreground text-sm">Yükleniyor...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                    {dashboardData?.totalTickets['Toplam Talep']}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-2 text-sm text-blue-600/80 dark:text-blue-400/80">
                                                    <ArrowUpRight className="h-4 w-4" />
                                                    <span>{dashboardData?.totalTickets['Değişim (Bu Ay)']}</span>
                                                    <span className="text-gray-600/60 dark:text-gray-400/60">bu ay</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-xl shadow-blue-500/10">
                                        <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Açık Talepler */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" />
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Açık Talepler</p>
                                        {loadingCards.openTickets ? (
                                            <div className="h-8 mt-1 flex items-center">
                                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span className="text-muted-foreground text-sm">Yükleniyor...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                                                    {dashboardData?.openTickets['Açık Talepler']}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-2 text-sm text-amber-600/80 dark:text-amber-400/80">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{dashboardData?.openTickets['Bekleyen Sayısı']} beklemede</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl shadow-xl shadow-amber-500/10">
                                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Bugün Çözülen */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" />
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Bugün Çözülen</p>
                                        {loadingCards.resolvedToday ? (
                                            <div className="h-8 mt-1 flex items-center">
                                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span className="text-muted-foreground text-sm">Yükleniyor...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                                    {dashboardData?.resolvedToday['Bugün Çözülen']}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-2 text-sm text-green-600/80 dark:text-green-400/80">
                                                    <ArrowUpRight className="h-4 w-4" />
                                                    <span>{dashboardData?.resolvedToday['Çözüm Oranı']}</span>
                                                    <span className="text-gray-600/60 dark:text-gray-400/60">çözüm oranı</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-xl shadow-green-500/10">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Aktif Temsilciler */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20" />
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Temsilciler</p>
                                        {loadingCards.activeAgents ? (
                                            <div className="h-8 mt-1 flex items-center">
                                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span className="text-muted-foreground text-sm">Yükleniyor...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                                    {dashboardData?.activeAgents['Aktif Temsilci']}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-2 text-sm text-purple-600/80 dark:text-purple-400/80">
                                                    <UserCheck className="h-4 w-4" />
                                                    <span>{dashboardData?.activeAgents['Müsait Temsilci']} müsait</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-xl shadow-purple-500/10">
                                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts and Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Ticket Trends Chart */}
                        <div className="lg:col-span-2">
                            {loadingCards.trendsChart ? (
                                <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 h-[400px] flex items-center justify-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-muted-foreground">Grafik yükleniyor...</p>
                                    </div>
                                </Card>
                            ) : dashboardData?.ticketStats ? (
                                <Card className="p-6 h-[400px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Talep Trendi</h3>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs text-muted-foreground">Açılan Talepler</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="text-xs text-muted-foreground">Çözülen Talepler</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[340px]">
                                        <TicketTrendsChart data={dashboardData.ticketStats} />
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-6 h-[400px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Talep Trendi</h3>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs text-muted-foreground">Açılan Talepler</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="text-xs text-muted-foreground">Çözülen Talepler</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">Grafik verisi bulunamadı</p>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Recent Tickets */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20" />
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                            <div className="p-6 relative h-[400px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-400">Son Talepler</h3>
                                        <p className="text-sm text-sky-600/70 dark:text-sky-400/70 mt-1">
                                            Son 10 talep
                                        </p>
                                    </div>
                                    <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl shadow-xl shadow-sky-500/10">
                                        <ClipboardList className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                                    </div>
                                </div>
                                {loadingCards.recentTickets ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-muted-foreground">Talep listesi yükleniyor...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 overflow-y-auto flex-1
                                        [&::-webkit-scrollbar]:w-2
                                        [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                                        [&::-webkit-scrollbar-thumb]:rounded-full
                                        [&::-webkit-scrollbar-track]:bg-transparent
                                        dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                                        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                                        dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                                        {(dashboardData?.recentTickets ?? []).map((ticket, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-sky-100/20 dark:border-sky-900/20 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {ticket.Subject}
                                                        </span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            ticket.Status === 'Açık' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            ticket.Status === 'Beklemede' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            ticket.Status === 'Çözüldü' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}>
                                                            {ticket.Status}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        #{ticket.TicketID} · {ticket.CreatedAt}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        ticket.Priority === 'Yüksek' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        ticket.Priority === 'Orta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                        {ticket.Priority}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}