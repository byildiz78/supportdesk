"use client"

import React, { useState, useEffect, useCallback, useRef, Fragment } from "react"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { useTheme } from "@/providers/theme-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Calendar as CalendarIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { DateRange } from "react-day-picker"

// Window tipini genişlet
declare global {
    interface Window {
        refreshHeatmap?: () => Promise<void>;
    }
}

// Loading overlay component
const LoadingOverlay = (props: any) => {
    return (
        <div className="flex items-center justify-center h-full w-full bg-background/80 backdrop-blur-sm absolute top-0 left-0 z-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
                <h3 className="text-lg font-medium">Veriler Yükleniyor</h3>
                {props.currentStep && (
                    <p className="text-sm text-muted-foreground">{props.currentStep}</p>
                )}
            </div>
        </div>
    );
};

// No data overlay component
const NoDataOverlay = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground/50"
            >
                <path d="M17.2 5H2.8a1.8 1.8 0 0 0-1.8 1.8v10.4a1.8 1.8 0 0 0 1.8 1.8h14.4a1.8 1.8 0 0 0 1.8-1.8V6.8A1.8 1.8 0 0 0 17.2 5Z" />
                <path d="M23 7v10" />
                <path d="M12 3.13a4 4 0 0 1 0 7.75" />
                <path d="M7 8v8" />
            </svg>
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Veri Bulunamadı</h3>
                <p className="text-sm text-muted-foreground">Seçili tarih aralığında gösterilecek veri yok.</p>
            </div>
        </div>
    );
};

// Heatmap cell component
const HeatmapCell = ({ value, maxValue, onClick, day, hour }: { 
    value: number, 
    maxValue: number, 
    onClick: (day: number, hour: number, count: number) => void,
    day: number,
    hour: number
}) => {
    const intensity = value > 0 ? Math.max(0.1, Math.min(0.9, value / maxValue)) : 0;
    
    return (
        <div 
            className={cn(
                "w-full h-full rounded-sm cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-medium",
                value > 0 ? "hover:opacity-80" : "hover:bg-primary/10"
            )}
            style={{ 
                backgroundColor: value > 0 ? `rgba(59, 130, 246, ${intensity})` : 'transparent',
                border: '1px solid rgba(226, 232, 240, 0.3)'
            }}
            onClick={() => onClick(day, hour, value)}
        >
            {value > 0 && value}
        </div>
    );
};

export default function TicketHeatmapPage() {
    const TAB_NAME = "Isı Haritası"
    const { activeTab, setActiveTab, addTab } = useTabStore()
    const { selectedFilter } = useFilterStore()
    
    // UI State
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState("Veriler hazırlanıyor...")
    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(0).map(() => Array(24).fill(0)))
    const [selectedView, setSelectedView] = useState<'week' | 'day'>('day') // Default to 'day' view
    const [selectedTickets, setSelectedTickets] = useState<any[]>([])
    const [showTicketDetails, setShowTicketDetails] = useState(false)
    const [maxValue, setMaxValue] = useState(0)
    const [rawTicketData, setRawTicketData] = useState<any[]>([])
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    
    // Referanslar
    const hasInitializedRef = useRef(false)
    const appliedAtRef = useRef(selectedFilter.appliedAt)
    const dataLoadedRef = useRef(false)
    
    // Theme
    const { theme } = useTheme()
    
    // Günlerin isimleri
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    
    // Isı haritası verilerini güncelleme fonksiyonu
    const updateHeatmapData = useCallback(() => {
        if (rawTicketData.length === 0) return;
        
        // Isı haritası verilerini hazırla
        const newHeatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
        let newMaxValue = 0;
        
        // Seçilen görünüme göre verileri filtrele
        let filteredTickets = [...rawTicketData];
        
        if (selectedView === 'day') {
            // Sadece bugünün verilerini göster
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD formatı
            
            filteredTickets = rawTicketData.filter(ticket => {
                if (!ticket.createdAt) return false;
                const ticketDate = new Date(ticket.createdAt);
                return ticketDate.toISOString().split('T')[0] === todayStr;
            });
        } else if (selectedView === 'week' && startDate && endDate) {
            // Seçilen tarih aralığındaki verileri göster
            const fromDate = new Date(startDate);
            const toDate = new Date(endDate);
            // Bitiş tarihini günün sonuna ayarla (23:59:59)
            toDate.setHours(23, 59, 59, 999);
            
            filteredTickets = rawTicketData.filter(ticket => {
                if (!ticket.createdAt) return false;
                const ticketDate = new Date(ticket.createdAt);
                return ticketDate >= fromDate && ticketDate <= toDate;
            });
        }
        
        // Verileri işle
        filteredTickets.forEach((ticket: any) => {
            if (ticket.createdAt) {
                const date = new Date(ticket.createdAt);
                // JavaScript'te 0=Pazar, 1=Pazartesi, ... 6=Cumartesi
                // Pazartesi=0 olacak şekilde düzenle
                const day = (date.getDay() + 6) % 7; // 0=Pazartesi, 1=Salı, ... 6=Pazar
                const hour = date.getHours();
                
                newHeatmapData[day][hour]++;
                
                if (newHeatmapData[day][hour] > newMaxValue) {
                    newMaxValue = newHeatmapData[day][hour];
                }
            }
        });
        
        setHeatmapData(newHeatmapData);
        setMaxValue(newMaxValue || 1); // En az 1 olsun ki bölme hatası olmasın
        
        // Veri yoksa kullanıcıya bildir
        if (filteredTickets.length === 0) {
            setError(selectedView === 'day' 
                ? "Bugün için veri bulunamadı." 
                : "Seçilen tarih aralığında veri bulunamadı.");
        } else {
            setError(null);
        }
    }, [rawTicketData, selectedView, startDate, endDate]);
    
    // Isı haritası verilerini getir
    const fetchHeatmapData = useCallback(async () => {
        try {
            setError(null);
            setLocalIsLoading(true);
            setCurrentStep("Isı haritası verileri getiriliyor...");
            
            // Tab filtresi
            const latestFilter = useTabStore.getState().getTabFilter(activeTab);
            
            // Varsayılan tarih aralığı (bugün)
            let dateFrom, dateTo;
            
            if (selectedView === 'day') {
                // Bugün için tarih aralığı
                const today = new Date();
                dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            } else if (selectedView === 'week' && startDate) {
                // Seçilen tarih aralığı
                dateFrom = new Date(startDate);
                dateTo = endDate 
                    ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
                    : new Date(new Date(startDate).setHours(23, 59, 59, 999));
            } else {
                // Varsayılan olarak son 7 gün
                const today = new Date();
                dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                dateFrom = new Date(today);
                dateFrom.setDate(dateFrom.getDate() - 6);
                dateFrom.setHours(0, 0, 0, 0);
                
                // Tarih aralığını güncelle
                setStartDate(dateFrom);
                setEndDate(new Date(dateTo));
            }
            
            console.log("Tarih aralığı:", {
                from: dateFrom.toISOString(),
                to: dateTo.toISOString(),
                view: selectedView,
                startDate: startDate,
                endDate: endDate
            });
            
            // API isteği - Backend'in beklediği parametreleri kullan (date1, date2)
            const response = await axios.post('/api/main/reports/heatmap', {
                date1: dateFrom.toISOString(),
                date2: dateTo.toISOString(),
                filter: latestFilter || {}
            });
            
            if (response.data) {
                setRawTicketData(response.data);
                dataLoadedRef.current = true;
                
                // Veri yoksa kullanıcıya bildir
                if (response.data.length === 0) {
                    setError("Seçilen tarih aralığında veri bulunamadı.");
                }
            } else {
                setError("Veri alınamadı.");
            }
        } catch (err: any) {
            console.error('Error fetching heatmap data:', err);
            setError(err.message || "Veri yüklenirken bir hata oluştu.");
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
        }
    }, [activeTab, selectedView, startDate, endDate]);
    
    // Görünüm değiştiğinde ısı haritasını güncelle
    useEffect(() => {
        updateHeatmapData();
    }, [selectedView, updateHeatmapData]);

    // Hücre tıklama olayı
    const handleCellClick = useCallback(async (day: number, hour: number, count: number) => {
        if (count === 0) return;
        
        try {
            setLocalIsLoading(true);
            setCurrentStep("Talep detayları getiriliyor...");
            
            // Mevcut rawTicketData'dan ilgili gün ve saatteki talepleri filtrele
            let filteredTickets = rawTicketData.filter((ticket: any) => {
                if (ticket.createdAt) {
                    const date = new Date(ticket.createdAt);
                    const ticketDay = (date.getDay() + 6) % 7;
                    const ticketHour = date.getHours();
                    
                    // Eğer "day" görünümündeyse, sadece bugünün verilerini kontrol et
                    if (selectedView === 'day') {
                        const today = new Date();
                        const todayStr = today.toISOString().split('T')[0];
                        const ticketDate = date.toISOString().split('T')[0];
                        
                        return ticketDay === day && ticketHour === hour && ticketDate === todayStr;
                    } else if (selectedView === 'week' && startDate && endDate) {
                        // Seçilen tarih aralığındaki verileri kontrol et
                        const fromDate = new Date(startDate);
                        const toDate = new Date(endDate);
                        // Bitiş tarihini günün sonuna ayarla (23:59:59)
                        toDate.setHours(23, 59, 59, 999);
                        
                        return ticketDay === day && ticketHour === hour && 
                               date >= fromDate && date <= toDate;
                    }
                    
                    return ticketDay === day && ticketHour === hour;
                }
                return false;
            });
            
            console.log(`${day}. gün, ${hour}. saat için ${filteredTickets.length} talep bulundu`);
            
            setSelectedTickets(filteredTickets);
            setShowTicketDetails(true);
        } catch (err: any) {
            console.error('Error loading ticket details:', err);
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
        }
    }, [rawTicketData, selectedView, startDate, endDate]);

    // Talep detaylarını açma fonksiyonu
    const openTicketDetails = (ticketId: string, ticketNo: string) => {
        const TabID = `ticket-${ticketNo}`;
        
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = useTabStore.getState().tabs.some(tab => tab.id === TabID);

        if (!isTabAlreadyOpen) {
            addTab({
                id: TabID,
                title: `Talep #${ticketNo}`,
                lazyComponent: () => import('@/app/[tenantId]/(main)/tickets/detail/page').then(module => ({
                    default: (props: any) => <module.default {...props} ticketId={ticketId} forceRefresh={true} />
                }))
            });
        } else {
            // Sekme zaten açıksa, önbelleği temizle
            try {
                const { clearTicketCache } = require('@/app/[tenantId]/(main)/tickets/detail/page');
                clearTicketCache(ticketId);
            } catch (error) {
                console.error("Önbellek temizleme hatası:", error);
            }
        }
        setActiveTab(TabID);
    };

    // Veri yükleme ve tab değişikliği izleme
    useEffect(() => {
        // Tab aktif olduğunda ve veri henüz yüklenmemişse yükle
        if (activeTab === TAB_NAME && !dataLoadedRef.current) {
            fetchHeatmapData();
        }
        
        // Global window fonksiyonu olarak refreshHeatmap'i tanımla
        window.refreshHeatmap = async () => {
            if (activeTab === TAB_NAME) {
                dataLoadedRef.current = false;
                return await fetchHeatmapData();
            }
            return Promise.resolve();
        };
        
        return () => {
            // Component unmount olduğunda global fonksiyonu temizle
            window.refreshHeatmap = undefined;
        };
    }, [activeTab, fetchHeatmapData, TAB_NAME]);
    
    // Component ilk mount olduğunda çalışır
    useEffect(() => {
        // Sayfa yüklendiğinde activeTab'i güncelle
        setActiveTab(TAB_NAME);
        
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
        }
        
        // Component komple unmount olduğunda veri durumunu sıfırla
        return () => {
            dataLoadedRef.current = false;
        };
    }, [setActiveTab, TAB_NAME]);

    // Sadece filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (activeTab === TAB_NAME) {
            console.log("Filtre kontrolü:", selectedFilter.appliedAt, appliedAtRef.current);
            if (selectedFilter.appliedAt !== appliedAtRef.current) {
                console.log("Filtre değişikliği algılandı:", selectedFilter);
                appliedAtRef.current = selectedFilter.appliedAt;
                // Filtre değiştiğinde dataLoadedRef'i sıfırla ve yeni veri yükle
                dataLoadedRef.current = false;
                fetchHeatmapData();
            }
        }
    }, [selectedFilter.appliedAt, activeTab, TAB_NAME, fetchHeatmapData]);
    
    // Görünüm değiştiğinde tarih seçiciyi otomatik göster
    useEffect(() => {
        if (selectedView === 'week' && (!startDate || !endDate)) {
            setShowStartDatePicker(true);
        }
    }, [selectedView, startDate, endDate]);
    
    // Tarih seçildiğinde veriyi yeniden yükle
    useEffect(() => {
        if (selectedView === 'week' && startDate && endDate) {
            fetchHeatmapData();
        }
    }, [startDate, endDate, selectedView, fetchHeatmapData]);
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            {localIsLoading && <LoadingOverlay currentStep={currentStep} />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Talep Isı Haritası</h2>
                <div className="flex items-center space-x-2">
                    <Select
                        value={selectedView}
                        onValueChange={(value: 'week' | 'day') => {
                            setSelectedView(value);
                            if (value === 'week' && (!startDate || !endDate)) {
                                // If switching to week view and no custom date range is set, show date picker
                                setShowStartDatePicker(true);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Görünüm Seç" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Bugün</SelectItem>
                            <SelectItem value="week">Tarih Aralığı</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {selectedView === 'week' && (
                        <div className="flex items-center space-x-2">
                            <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="justify-start text-left font-normal w-[240px]"
                                        onClick={() => setShowStartDatePicker(true)}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? (
                                            format(startDate, "dd MMM yyyy", { locale: tr })
                                        ) : (
                                            <span>Başlangıç Tarihi Seç</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="single"
                                        defaultMonth={startDate || new Date()}
                                        selected={startDate}
                                        onSelect={(date) => {
                                            console.log("Seçilen başlangıç tarihi:", date);
                                            if (date) {
                                                setStartDate(date);
                                                
                                                // Apply the custom date range
                                                const latestFilter = useTabStore.getState().getTabFilter(activeTab);
                                                if (latestFilter) {
                                                    const newFilter = {
                                                        ...latestFilter,
                                                        date: {
                                                            from: date.toISOString(),
                                                            to: endDate ? endDate.toISOString() : date.toISOString(),
                                                        },
                                                        appliedAt: Date.now(),
                                                    };
                                                    useTabStore.getState().setTabFilter(activeTab, newFilter);
                                                }
                                                
                                                setShowEndDatePicker(true);
                                            }
                                        }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {startDate && (
                                <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-normal w-[240px]"
                                            onClick={() => setShowEndDatePicker(true)}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? (
                                                format(endDate, "dd MMM yyyy", { locale: tr })
                                            ) : (
                                                <span>Bitiş Tarihi Seç</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="single"
                                            defaultMonth={endDate || startDate}
                                            selected={endDate}
                                            onSelect={(date) => {
                                                console.log("Seçilen bitiş tarihi:", date);
                                                if (date) {
                                                    setEndDate(date);
                                                    
                                                    // Apply the custom date range
                                                    const latestFilter = useTabStore.getState().getTabFilter(activeTab);
                                                    if (latestFilter) {
                                                        const newFilter = {
                                                            ...latestFilter,
                                                            date: {
                                                                from: startDate.toISOString(),
                                                                to: date.toISOString(),
                                                            },
                                                            appliedAt: Date.now(),
                                                        };
                                                        useTabStore.getState().setTabFilter(activeTab, newFilter);
                                                    }
                                                    
                                                    setShowEndDatePicker(false);
                                                }
                                            }}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    )}
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchHeatmapData()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Yenile
                    </Button>
                </div>
            </div>
            
            <div className="flex-grow">
                {error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">Bir hata oluştu</h3>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => fetchHeatmapData()}
                            >
                                Tekrar Dene
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Card className="flex-1 overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle>Taleplerin Açılma Saatleri</CardTitle>
                            <CardDescription>
                                Taleplerin hangi gün ve saatlerde açıldığını gösteren ısı haritası. Hücrelere tıklayarak o saat dilimindeki talepleri görebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
                            <div className="flex-1 p-4 overflow-auto">
                                <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1 h-full">
                                    {/* Saat Başlıkları */}
                                    <div className=""></div>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={`hour-${i}`} className="text-center text-xs font-medium text-muted-foreground">
                                            {i}:00
                                        </div>
                                    ))}
                                    
                                    {/* Günler ve Hücreler */}
                                    {dayNames.map((day, dayIndex) => (
                                        <Fragment key={`day-${dayIndex}`}>
                                            <div className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                {day}
                                            </div>
                                            {Array.from({ length: 24 }).map((_, hourIndex) => (
                                                <div key={`cell-${dayIndex}-${hourIndex}`} className="aspect-square">
                                                    <HeatmapCell 
                                                        value={heatmapData[dayIndex][hourIndex]} 
                                                        maxValue={maxValue}
                                                        onClick={handleCellClick}
                                                        day={dayIndex}
                                                        hour={hourIndex}
                                                    />
                                                </div>
                                            ))}
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Seçilen Talepler */}
                            {showTicketDetails && selectedTickets.length > 0 && (
                                <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>Seçilen Zaman Dilimindeki Talepler ({selectedTickets.length})</DialogTitle>
                                            <DialogDescription>
                                                Bu zaman diliminde açılan taleplerin listesi
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-auto">
                                            <table className="w-full border-collapse">
                                                <thead className="sticky top-0 bg-background z-10">
                                                    <tr className="border-b">
                                                        <th className="text-left p-2 text-sm font-medium">Talep No</th>
                                                        <th className="text-left p-2 text-sm font-medium">Başlık</th>
                                                        <th className="text-left p-2 text-sm font-medium">Durum</th>
                                                        <th className="text-left p-2 text-sm font-medium">Öncelik</th>
                                                        <th className="text-left p-2 text-sm font-medium">Oluşturulma Tarihi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedTickets.map((ticket) => (
                                                        <tr 
                                                            key={ticket.id} 
                                                            className="border-b hover:bg-muted/50 cursor-pointer"
                                                            onClick={() => {
                                                                setShowTicketDetails(false);
                                                                openTicketDetails(ticket.id, ticket.ticketno);
                                                            }}
                                                        >
                                                            <td className="p-2 text-sm font-medium text-primary">
                                                                {ticket.ticketno}
                                                            </td>
                                                            <td className="p-2 text-sm">{ticket.title}</td>
                                                            <td className="p-2 text-sm">
                                                                <StatusBadge status={ticket.status} />
                                                            </td>
                                                            <td className="p-2 text-sm">
                                                                <PriorityBadge priority={ticket.priority} />
                                                            </td>
                                                            <td className="p-2 text-sm">
                                                                {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const statusMap: Record<string, { label: string, color: string }> = {
        'open': { label: 'Açık', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'pending': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'waiting': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'in_progress': { label: 'İşlemde', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'resolved': { label: 'Çözüldü', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
        'closed': { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
        'deleted': { label: 'Silindi', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    
    const { label, color } = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color} inline-flex items-center justify-center`}>
            {label}
        </div>
    );
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
    const priorityMap: Record<string, { label: string, color: string }> = {
        'low': { label: 'Düşük', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'medium': { label: 'Orta', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'high': { label: 'Yüksek', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
        'critical': { label: 'Kritik', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
        'urgent': { label: 'Acil', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
    };
    
    const { label, color } = priorityMap[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
    
    return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color} inline-flex items-center justify-center`}>
            {label}
        </div>
    );
};
