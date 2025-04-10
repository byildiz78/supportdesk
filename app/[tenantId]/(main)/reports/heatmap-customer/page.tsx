"use client"

import React, { useState, useEffect, useCallback, useRef, Fragment } from "react"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { useTheme } from "@/providers/theme-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Calendar as CalendarIcon, Filter, Check, ChevronsUpDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { 
    Command, 
    CommandEmpty, 
    CommandGroup, 
    CommandInput, 
    CommandItem, 
    CommandList 
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

// Window tipini genişlet
declare global {
    interface Window {
        refreshCustomerHeatmap?: () => Promise<void>;
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
const HeatmapCell = ({ value, maxValue, onClick, company, hour }: { 
    value: number, 
    maxValue: number, 
    onClick: (company: string, hour: string, count: number) => void,
    company: string,
    hour: string
}) => {
    // Only apply color intensity if value > 5
    const intensity = value > 5 ? Math.max(0.1, Math.min(0.9, value / maxValue)) : 0;
    
    return (
        <div 
            className={cn(
                "w-full h-full rounded-sm cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-medium",
                value > 0 ? "hover:opacity-80" : "hover:bg-primary/10"
            )}
            style={{ 
                backgroundColor: value > 5 ? `rgba(59, 130, 246, ${intensity})` : 'transparent',
                border: '1px solid rgba(226, 232, 240, 0.3)'
            }}
            onClick={() => onClick(company, hour, value)}
        >
            {value > 0 && value}
        </div>
    );
};

export default function CustomerHeatmapPage() {
    const TAB_NAME = "Isı Haritası-Müşteri"
    const { activeTab, setActiveTab, addTab } = useTabStore()
    const { selectedFilter } = useFilterStore()
    
    // UI State
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState("Veriler hazırlanıyor...")
    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [heatmapData, setHeatmapData] = useState<Record<string, Record<string, number>>>({})
    const [selectedTickets, setSelectedTickets] = useState<any[]>([])
    const [showTicketDetails, setShowTicketDetails] = useState(false)
    const [maxValue, setMaxValue] = useState(0)
    const [rawTicketData, setRawTicketData] = useState<any[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [hours, setHours] = useState<string[]>([])
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [showCompanyFilter, setShowCompanyFilter] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [showCategoryFilter, setShowCategoryFilter] = useState(false)
    const [companyTotals, setCompanyTotals] = useState<Record<string, number>>({});
    
    // Referanslar
    const hasInitializedRef = useRef(false)
    const appliedAtRef = useRef(selectedFilter.appliedAt)
    const dataLoadedRef = useRef(false)
    
    // Theme
    const { theme } = useTheme()
    
    // Saatleri oluştur (0-23)
    useEffect(() => {
        const hoursArray = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        setHours(hoursArray);
    }, []);
    
    // Isı haritası verilerini güncelleme fonksiyonu
    const updateHeatmapData = useCallback(() => {
        if (rawTicketData.length === 0) return;
        
        // Şirket ve saat verilerini topla
        const companyMap: Record<string, Record<string, number>> = {};
        const companyTotals: Record<string, number> = {}; // Şirket başına toplam talep sayısı
        const allCompanies = new Set<string>();
        const allCategories = new Set<string>();
        let newMaxValue = 0;
        
        // Ana sayfadan gelen filtre tarihlerini kullan
        let filteredTickets = [...rawTicketData];
        
        // Verileri işle
        filteredTickets.forEach((ticket: any) => {
            const companyName = ticket.companyName || "Tanımlanmamış";
            const categoryName = ticket.categoryName || "Tanımlanmamış";
            const ticketDate = new Date(ticket.createdAt);
            const hourKey = `${ticketDate.getHours().toString().padStart(2, '0')}:00`;
            
            // Şirket listesini güncelle
            allCompanies.add(companyName);
            
            // Kategori listesini güncelle
            allCategories.add(categoryName);
            
            // Şirket haritasını güncelle
            if (!companyMap[companyName]) {
                companyMap[companyName] = {};
                companyTotals[companyName] = 0;
            }
            
            if (!companyMap[companyName][hourKey]) {
                companyMap[companyName][hourKey] = 0;
            }
            
            companyMap[companyName][hourKey]++;
            companyTotals[companyName]++; // Toplam sayıyı artır
            
            // Maksimum değeri güncelle
            if (companyMap[companyName][hourKey] > newMaxValue) {
                newMaxValue = companyMap[companyName][hourKey];
            }
        });
        
        // Tüm şirket ve saat kombinasyonları için boş değerler ata
        allCompanies.forEach(company => {
            if (!companyMap[company]) {
                companyMap[company] = {};
                companyTotals[company] = 0;
            }
            
            hours.forEach(hour => {
                if (!companyMap[company][hour]) {
                    companyMap[company][hour] = 0;
                }
            });
        });
        
        setHeatmapData(companyMap);
        setMaxValue(newMaxValue || 1); // En az 1 olsun ki bölme hatası olmasın
        
        // Şirketleri toplam talep sayısına göre sırala (çoktan aza)
        const sortedCompanies = Array.from(allCompanies).sort((a, b) => {
            return companyTotals[b] - companyTotals[a];
        });
        
        setCompanies(sortedCompanies);
        setCategories(Array.from(allCategories).sort());
        
        // Toplam sayıları state'e kaydet
        setCompanyTotals(companyTotals);
        
        // Veri yoksa kullanıcıya bildir
        if (filteredTickets.length === 0) {
            setError("Seçilen tarih aralığında veri bulunamadı.");
        } else {
            setError(null);
        }
        
    }, [rawTicketData, hours]);
    
    // Isı haritası verilerini getir
    const fetchHeatmapData = useCallback(async () => {
        try {
            setError(null);
            setLocalIsLoading(true);
            setCurrentStep("Müşteri ısı haritası verileri getiriliyor...");
            
            // Tab filtresi
            const latestFilter = useTabStore.getState().getTabFilter(activeTab);
            
            // Ana sayfadan gelen tarih aralığını kullan
            let dateFrom, dateTo;
            
            if (latestFilter?.date?.from && latestFilter?.date?.to) {
                dateFrom = new Date(latestFilter.date.from);
                dateTo = new Date(new Date(latestFilter.date.to).setHours(23, 59, 59, 999));
            } else {
                // Varsayılan olarak son 7 gün
                const today = new Date();
                dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                dateFrom = new Date(today);
                dateFrom.setDate(dateFrom.getDate() - 6);
                dateFrom.setHours(0, 0, 0, 0);
            }
            
            // API isteği - Backend'in beklediği parametreleri kullan (date1, date2)
            const response = await axios.post('/api/main/reports/heatmap-customer', {
                date1: dateFrom.toISOString(),
                date2: dateTo.toISOString(),
                filter: {
                    ...latestFilter || {},
                    selectedCompanies: selectedCompanies.length > 0 ? selectedCompanies : undefined,
                    selectedCategories: selectedCategories.length > 0 ? selectedCategories : undefined
                }
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
            console.error('Error fetching customer heatmap data:', err);
            setError(err.message || "Veri yüklenirken bir hata oluştu.");
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
        }
    }, [activeTab, selectedCompanies, selectedCategories]);
    
    // Hücre tıklama olayı
    const handleCellClick = useCallback(async (company: string, hour: string, count: number) => {
        if (count === 0) return;
        
        try {
            setLocalIsLoading(true);
            setCurrentStep("Talep detayları getiriliyor...");
            
            // Mevcut rawTicketData'dan ilgili şirket ve saatteki talepleri filtrele
            let filteredTickets = rawTicketData.filter((ticket: any) => {
                const ticketCompany = ticket.companyName || "Tanımlanmamış";
                const ticketDate = new Date(ticket.createdAt);
                const hourKey = `${ticketDate.getHours().toString().padStart(2, '0')}:00`;
                
                return ticketCompany === company && hourKey === hour;
            });
            
            setSelectedTickets(filteredTickets);
            setShowTicketDetails(true);
        } catch (err: any) {
            console.error('Error loading ticket details:', err);
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
        }
    }, [rawTicketData]);
    
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
        
        // Global window fonksiyonu olarak refreshCustomerHeatmap'i tanımla
        window.refreshCustomerHeatmap = async () => {
            if (activeTab === TAB_NAME) {
                dataLoadedRef.current = false;
                return await fetchHeatmapData();
            }
            return Promise.resolve();
        };
        
        return () => {
            // Component unmount olduğunda global fonksiyonu temizle
            window.refreshCustomerHeatmap = undefined;
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
            if (selectedFilter.appliedAt !== appliedAtRef.current) {
                appliedAtRef.current = selectedFilter.appliedAt;
                // Filtre değiştiğinde dataLoadedRef'i sıfırla ve yeni veri yükle
                dataLoadedRef.current = false;
                fetchHeatmapData();
            }
        }
    }, [selectedFilter.appliedAt, activeTab, TAB_NAME, fetchHeatmapData]);
    
    // Veri geldiğinde ısı haritasını güncelle
    useEffect(() => {
        updateHeatmapData();
    }, [updateHeatmapData]);

    // Şirket filtresi için fonksiyonlar
    const toggleCompanySelection = (company: string) => {
        setSelectedCompanies(prev => {
            if (prev.includes(company)) {
                return prev.filter(c => c !== company);
            } else {
                return [...prev, company];
            }
        });
    };

    const selectAllCompanies = () => {
        setSelectedCompanies([...companies]);
    };

    const clearCompanySelection = () => {
        setSelectedCompanies([]);
    };

    // Kategori filtresi için fonksiyonlar
    const toggleCategorySelection = (category: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const selectAllCategories = () => {
        setSelectedCategories([...categories]);
    };

    const clearCategorySelection = () => {
        setSelectedCategories([]);
    };

    // Filtrelenmiş şirketleri hesapla
    const filteredCompanies = selectedCompanies.length > 0
        ? companies.filter(company => selectedCompanies.includes(company))
        : companies;
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            {localIsLoading && <LoadingOverlay currentStep={currentStep} />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Müşteri Isı Haritası</h2>
                <div className="flex items-center space-x-2">
                    <Popover open={showCategoryFilter} onOpenChange={setShowCategoryFilter}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1.5"
                                onClick={() => setShowCategoryFilter(true)}
                            >
                                <Filter className="h-4 w-4" />
                                Kategori Filtresi
                                {selectedCategories.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 rounded-full">
                                        {selectedCategories.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Kategori ara..." />
                                <CommandList>
                                    <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
                                    <CommandGroup>
                                        <div className="p-2 border-b flex justify-between">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={selectAllCategories}
                                                className="text-xs"
                                            >
                                                Tümünü Seç
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={clearCategorySelection}
                                                className="text-xs"
                                            >
                                                Temizle
                                            </Button>
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            {categories.map((category) => (
                                                <CommandItem
                                                    key={category}
                                                    onSelect={() => toggleCategorySelection(category)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                                                        selectedCategories.includes(category) 
                                                            ? "bg-primary border-primary" 
                                                            : "border-muted-foreground"
                                                    )}>
                                                        {selectedCategories.includes(category) && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span>{category}</span>
                                                </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Popover open={showCompanyFilter} onOpenChange={setShowCompanyFilter}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1.5"
                                onClick={() => setShowCompanyFilter(true)}
                            >
                                <Filter className="h-4 w-4" />
                                Firma Filtresi
                                {selectedCompanies.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 rounded-full">
                                        {selectedCompanies.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Firma ara..." />
                                <CommandList>
                                    <CommandEmpty>Firma bulunamadı.</CommandEmpty>
                                    <CommandGroup>
                                        <div className="p-2 border-b flex justify-between">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={selectAllCompanies}
                                                className="text-xs"
                                            >
                                                Tümünü Seç
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={clearCompanySelection}
                                                className="text-xs"
                                            >
                                                Temizle
                                            </Button>
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            {companies.map((company) => (
                                                <CommandItem
                                                    key={company}
                                                    onSelect={() => toggleCompanySelection(company)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                                                        selectedCompanies.includes(company) 
                                                            ? "bg-primary border-primary" 
                                                            : "border-muted-foreground"
                                                    )}>
                                                        {selectedCompanies.includes(company) && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span>{company}</span>
                                                </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchHeatmapData()}
                        className="flex items-center gap-1.5"
                    >
                        <RefreshCw className="h-4 w-4" />
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
                    <Card className="flex-1 overflow-hidden border-muted shadow-sm">
                        <CardHeader className="pb-2 bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                    <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2" />
                                    <path d="M9 14h10" />
                                    <path d="M15 8h4v4" />
                                    <path d="M19 8v4h-4" />
                                </svg>
                                Müşteri ve Saate Göre Talep Dağılımı
                                {selectedCompanies.length > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        {selectedCompanies.length} firma seçili
                                    </Badge>
                                )}
                                {selectedCategories.length > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        {selectedCategories.length} kategori seçili
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Taleplerin hangi müşterilerden ve saatlerde açıldığını gösteren ısı haritası. Hücrelere tıklayarak o müşteriye ait talepleri görebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
                            <div className="flex-1 p-2 md:p-4 overflow-auto">
                                {filteredCompanies.length > 0 && hours.length > 0 ? (
                                    <div className="relative overflow-x-auto">
                                        <div className="grid" style={{ 
                                            gridTemplateColumns: `minmax(100px, auto) repeat(${hours.length}, minmax(40px, 1fr))`,
                                            gap: '2px',
                                            minWidth: '800px'
                                        }}>
                                            {/* Saat Başlıkları */}
                                            <div className="text-center text-xs font-medium text-muted-foreground p-2 truncate sticky top-0 left-0 bg-background z-20 border-b border-r"></div>
                                            {hours.map((hour, i) => (
                                                <div key={`hour-${i}`} className={`text-center text-xs font-medium p-2 truncate sticky top-0 bg-background z-10 border-b ${i % 6 === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {hour}
                                                </div>
                                            ))}
                                            
                                            {/* Şirketler ve Hücreler */}
                                            {filteredCompanies.map((company, companyIndex) => (
                                                <React.Fragment key={`company-${companyIndex}`}>
                                                    <div className="flex items-center justify-between text-xs font-medium whitespace-nowrap sticky left-0 bg-background z-10 border-r h-10 pl-2">
                                                        <span className="truncate max-w-[150px]">{company}</span>
                                                        <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                                            {companyTotals[company] || 0}
                                                        </span>
                                                    </div>
                                                    {hours.map((hour, hourIndex) => (
                                                        <div key={`cell-${companyIndex}-${hourIndex}`} className="h-10 w-full">
                                                            <HeatmapCell 
                                                                value={heatmapData[company]?.[hour] || 0} 
                                                                maxValue={maxValue}
                                                                onClick={handleCellClick}
                                                                company={company}
                                                                hour={hour}
                                                            />
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <NoDataOverlay />
                                )}
                            </div>
                            
                            {/* Seçilen Talepler */}
                            {showTicketDetails && selectedTickets.length > 0 && (
                                <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
                                    <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col p-0">
                                        <DialogHeader className="px-6 py-4 border-b">
                                            <DialogTitle className="text-xl flex items-center gap-2">
                                                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                                                    {selectedTickets.length}
                                                </div>
                                                <span>Seçilen Müşterinin Talepleri</span>
                                            </DialogTitle>
                                            <DialogDescription className="text-muted-foreground mt-1">
                                                Bu müşteri ve saat aralığında açılan taleplerin listesi
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-auto p-4">
                                            <div className="rounded-lg border overflow-hidden">
                                                <table className="w-full border-collapse">
                                                    <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                                                        <tr>
                                                            <th className="text-left px-4 py-3 text-sm font-medium">Talep No</th>
                                                            <th className="text-left px-4 py-3 text-sm font-medium">Başlık</th>
                                                            <th className="text-left px-4 py-3 text-sm font-medium">Durum</th>
                                                            <th className="text-left px-4 py-3 text-sm font-medium">Firma</th>
                                                            <th className="text-left px-4 py-3 text-sm font-medium">Oluşturulma Tarihi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {selectedTickets.map((ticket) => (
                                                            <tr 
                                                                key={ticket.id} 
                                                                className="hover:bg-muted/50 cursor-pointer transition-colors"
                                                                onClick={() => {
                                                                    setShowTicketDetails(false);
                                                                    openTicketDetails(ticket.id, ticket.ticketno);
                                                                }}
                                                            >
                                                                <td className="px-4 py-3 text-sm font-medium text-primary">
                                                                    #{ticket.ticketno}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm">{ticket.title}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <StatusBadge status={ticket.status} />
                                                                </td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-primary/10 rounded-full p-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                                                <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2" />
                                                                                <path d="M9 14h10" />
                                                                                <path d="M15 8h4v4" />
                                                                                <path d="M19 8v4h-4" />
                                                                            </svg>
                                                                        </div>
                                                                        {ticket.companyName || "Belirsiz"}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-muted rounded-full p-1">
                                                                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                                        </div>
                                                                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
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
