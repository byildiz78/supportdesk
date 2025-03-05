"use client";

import { useCallback, useEffect, useState } from "react";
import { useFilterStore } from "@/stores/filters-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Clock, MessageSquare, CheckCircle2, AlertCircle, Users, UserCheck, ClipboardList } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/stores/tab-store";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast/use-toast";
import { useFilterEventStore } from "@/stores/filter-event-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useRefreshStore, REFRESH_INTERVAL } from "@/stores/refresh-store";
import { useCountdown } from "@/hooks/useCountdown";

export default function Dashboard() {
    const { activeTab } = useTabStore();
    const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
    const { settings } = useSettingsStore();
    const { selectedFilter } = useFilterStore();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [loadingCards, setLoadingCards] = useState({
        totalTickets: true,
        openTickets: true,
        resolvedToday: true,
        averageResponse: true,
    });
    
    const [hasFetched, setHasFetched] = useState(false);
    const [localDateFilter, setLocalDateFilter] = useState(selectedFilter.date);
    const { setIsDashboardTab } = useDashboardStore();
    const { filterApplied, setFilterApplied } = useFilterEventStore();
    const { setShouldFetch, shouldFetch } = useRefreshStore();

    useEffect(() => {
        if (selectedFilter.branches) {
            setSelectedBranches(selectedFilter.branches.map(item => item.BranchID));
        }
    }, [selectedFilter]);

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
                    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg px-3 py-2 text-sm text-muted-foreground text-start flex items-center gap-2 group">
                        <div className="duration-[8000ms] text-blue-500 group-hover:text-blue-600 [animation:spin_6s_linear_infinite]">
                            <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium w-4 text-center">{count}</span>
                        <span>saniye</span>
                    </div>
                </div>

                <div className="p-3 space-y-4 md:space-y-6 pb-20">
                    {/* Summary Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Tickets */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Talepler</p>
                                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">156</h3>
                                        <div className="flex items-center gap-1 mt-2 text-sm text-blue-600/80 dark:text-blue-400/80">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>12%</span>
                                            <span className="text-gray-600/60 dark:text-gray-400/60">bu ay</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-xl shadow-blue-500/10">
                                        <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Open Tickets */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Açık Talepler</p>
                                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">42</h3>
                                        <div className="flex items-center gap-1 mt-2 text-sm text-amber-600/80 dark:text-amber-400/80">
                                            <Clock className="h-4 w-4" />
                                            <span>8 beklemede</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl shadow-xl shadow-amber-500/10">
                                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Resolved Today */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Bugün Çözülen</p>
                                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">24</h3>
                                        <div className="flex items-center gap-1 mt-2 text-sm text-green-600/80 dark:text-green-400/80">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>85%</span>
                                            <span className="text-gray-600/60 dark:text-gray-400/60">çözüm oranı</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-xl shadow-green-500/10">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Active Agents */}
                        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20" />
                            <div className="p-6 relative">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Temsilciler</p>
                                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">12</h3>
                                        <div className="flex items-center gap-1 mt-2 text-sm text-purple-600/80 dark:text-purple-400/80">
                                            <UserCheck className="h-4 w-4" />
                                            <span>5 müsait</span>
                                        </div>
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
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Talep Trendi</h3>
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Grafik yükleniyor...
                                </div>
                            </Card>
                        </div>

                        {/* Recent Tickets */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Son Talepler</h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">Örnek Talep #{i + 1}</div>
                                            <div className="text-sm text-muted-foreground">2 saat önce</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}