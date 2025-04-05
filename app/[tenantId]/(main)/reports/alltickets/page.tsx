"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useFilterStore } from "@/stores/filters-store"
import axios from "@/lib/axios"
import { useTabStore } from "@/stores/tab-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/providers/theme-provider"

// AG Grid imports
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, CellClickedEvent } from 'ag-grid-community'
import 'ag-grid-enterprise'

// Window tipini genişlet
declare global {
    interface Window {
        // @ts-ignore
        refreshTicketList?: () => Promise<void>;
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

// No rows overlay component
const NoRowsOverlay = () => {
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

// Hücre renderer bileşenleri
const StatusCellRenderer = (props: any) => {
    const statusMap: Record<string, { label: string, color: string }> = {
        'open': { label: 'Açık', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'pending': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'waiting': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'in_progress': { label: 'İşlemde', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'resolved': { label: 'Çözüldü', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
        'closed': { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
        'deleted': { label: 'Silindi', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    
    const status = props.value || '';
    const { label, color } = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color} inline-flex items-center justify-center`}>
            {label}
        </div>
    );
};

const PriorityCellRenderer = (props: any) => {
    const priorityMap: Record<string, { label: string, color: string }> = {
        'low': { label: 'Düşük', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        'medium': { label: 'Orta', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
        'high': { label: 'Yüksek', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
        'critical': { label: 'Kritik', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
        'urgent': { label: 'Acil', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
    };
    
    const priority = props.value || '';
    const { label, color } = priorityMap[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
    
    return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color} inline-flex items-center justify-center`}>
            {label}
        </div>
    );
};

const SlaBreachCellRenderer = (props: any) => {
    if (props.value === true) {
        return (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 inline-flex items-center justify-center">
                Evet
            </div>
        );
    } else if (props.value === false) {
        return (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 inline-flex items-center justify-center">
                Hayır
            </div>
        );
    }
    return null;
};

const DateCellRenderer = (props: any) => {
    if (!props.value) return null;
    
    const date = new Date(props.value);
    const formattedDate = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return <div>{formattedDate}</div>;
};

const TicketNoCellRenderer = (props: any) => {
    return (
        <div className="font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer flex items-center">
            {props.value || ''}
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-1 h-3 w-3"
            >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        </div>
    );
};

export default function AllTicketsPage() {
    const TAB_NAME = "Tüm Ticketlar"
    const { activeTab, setActiveTab, addTab } = useTabStore()
    const { selectedFilter } = useFilterStore()
    // UI State
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState("Veriler hazırlanıyor...")
    const [rowData, setRowData] = useState<any[]>([])
    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [filters, setFilters] = useState<any>({})
    // Referanslar
    const hasInitializedRef = useRef(false)
    const appliedAtRef = useRef(selectedFilter.appliedAt)
    // Sadece veri yüklenip yüklenmediğini takip edelim
    const dataLoadedRef = useRef(false)
    // Theme
    const { theme } = useTheme()
    
    // AG Grid column definitions
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    
    // Dinamik kolon oluşturma
    useEffect(() => {
        if (rowData.length > 0) {
            // İlk veri satırından kolonları oluştur
            const firstRow = rowData[0];
            const dynamicColumns: ColDef[] = [];
            
            // Kolon adları için Türkçe karşılıklar
            const columnLabels: Record<string, string> = {
                'id': 'ID',
                'ticketno': 'Talep No',
                'title': 'Başlık',
                'description': 'Açıklama',
                'status': 'Durum',
                'priority': 'Öncelik',
                'source': 'Kaynak',
                'categoryId': 'Kategori ID',
                'subcategoryId': 'Alt Kategori ID',
                'groupId': 'Grup ID',
                'assignedTo': 'Atanan ID',
                'assignedUserName': 'Atanan Kişi',
                'customerName': 'Müşteri Adı',
                'customerEmail': 'Müşteri E-posta',
                'customerPhone': 'Müşteri Telefon',
                'companyName': 'Firma Adı',
                'companyId': 'Firma ID',
                'contactPosition': 'İletişim Pozisyonu',
                'dueDate': 'Son Tarih',
                'slaBreach': 'SLA İhlali',
                'resolutionTime': 'Çözüm Tarihi',
                'createdAt': 'Oluşturulma Tarihi',
                'createdBy': 'Oluşturan',
                'updatedAt': 'Son Güncelleme',
                'updatedBy': 'Güncelleyen',
                'callcount': 'Çağrı Sayısı',
                'isDeleted': 'Silindi'
            };
            
            // Özel hücre rendererlar için eşleştirme
            const cellRendererComponents: Record<string, any> = {
                'status': StatusCellRenderer,
                'priority': PriorityCellRenderer,
                'slaBreach': SlaBreachCellRenderer,
                'createdAt': DateCellRenderer,
                'updatedAt': DateCellRenderer,
                'dueDate': DateCellRenderer,
                'ticketno': TicketNoCellRenderer
            };
            
            // Tarih alanları
            const dateFields = ['createdAt', 'updatedAt', 'dueDate', 'resolutionTime'];
            
            // Özel filtre değerleri
            const statusValues = ['open', 'pending', 'waiting', 'in_progress', 'resolved', 'closed', 'deleted'];
            const priorityValues = ['low', 'medium', 'high', 'critical', 'urgent'];
            
            // Öncelikli kolonlar - Her zaman en başta olacak kolonlar
            if ('ticketno' in firstRow) {
                dynamicColumns.push({
                    headerName: columnLabels['ticketno'] || 'Talep No',
                    field: 'ticketno',
                    filter: 'agNumberColumnFilter',
                    width: 120,
                    pinned: 'left',
                    cellRenderer: TicketNoCellRenderer
                });
            }
            
            if ('title' in firstRow) {
                dynamicColumns.push({
                    headerName: columnLabels['title'] || 'Başlık',
                    field: 'title',
                    filter: 'agTextColumnFilter',
                    minWidth: 250,
                    flex: 1,
                });
            }
            
            // Diğer tüm kolonları ekle
            for (const key in firstRow) {
                // Zaten eklenen kolonları atla
                if (key === 'ticketno' || key === 'title') continue;
                
                // Kolon tanımını oluştur
                const columnDef: ColDef = {
                    headerName: columnLabels[key] || key,
                    field: key,
                    filter: typeof firstRow[key] === 'number' 
                        ? 'agNumberColumnFilter' 
                        : typeof firstRow[key] === 'boolean'
                            ? 'agSetColumnFilter'
                            : dateFields.includes(key)
                                ? 'agDateColumnFilter'
                                : key === 'status' || key === 'priority'
                                    ? 'agSetColumnFilter'
                                    : 'agTextColumnFilter',
                    filterParams: typeof firstRow[key] === 'string' 
                        ? {
                            filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
                            buttons: ['reset', 'apply'],
                            closeOnApply: true,
                            suppressAndOrCondition: false,
                            debounceMs: 200
                        }
                        : typeof firstRow[key] === 'boolean'
                            ? {
                                suppressSelectAll: false,
                                suppressMiniFilter: false,
                                values: [true, false]
                            }
                            : key === 'status'
                                ? {
                                    values: statusValues,
                                    suppressMiniFilter: false,
                                    buttons: ['reset', 'apply'],
                                    closeOnApply: true,
                                    debounceMs: 200
                                }
                                : key === 'priority'
                                    ? {
                                        values: priorityValues,
                                        suppressMiniFilter: false,
                                        buttons: ['reset', 'apply'],
                                        closeOnApply: true,
                                        debounceMs: 200
                                    }
                                    : {
                                        buttons: ['reset', 'apply'],
                                        debounceMs: 200,
                                        newRowsAction: 'keep'
                                    },
                    width: key === 'description' ? 300 : 150,
                };
                
                // Özel hücre renderer ekle
                if (cellRendererComponents[key]) {
                    columnDef.cellRenderer = cellRendererComponents[key];
                }
                
                dynamicColumns.push(columnDef);
            }
            
            setColumnDefs(dynamicColumns);
        }
    }, [rowData]);
    
    // AG Grid default column definitions
    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        suppressMenu: false,
        menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'] as any,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
        filterParams: {
            suppressMiniFilter: false,
            applyMiniFilterWhileTyping: true,
            debounceMs: 200,
            newRowsAction: 'keep'
        }
    };

    // AG Grid auto group column definition
    const autoGroupColumnDef = {
        minWidth: 200,
        cellRendererParams: {
            suppressCount: false,
            checkbox: false,
        },
        headerName: 'Grup',
        field: 'ag-Grid-AutoColumn',
    };

    // AG Grid sidebar configuration
    const sideBar = {
        toolPanels: [
            {
                id: 'columns',
                labelDefault: 'Kolonlar',
                labelKey: 'columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
                toolPanelParams: {
                    suppressRowGroups: false,
                    suppressValues: false,
                    suppressPivots: false,
                    suppressPivotMode: false,
                }
            },
            {
                id: 'filters',
                labelDefault: 'Filtreler',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
            }
        ],
        defaultToolPanel: '',
        position: 'right' as const
    };

    // AG Grid chart theme overrides
    const chartThemeOverrides = {
        common: {
            title: {
                enabled: true,
                text: 'Talep Raporları',
                fontWeight: 'bold',
                fontSize: 16,
                color: theme === 'dark' ? '#ffffff' : '#000000',
            },
            legend: {
                position: 'bottom',
                spacing: 40,
                item: {
                    label: {
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                    },
                },
            },
            axes: {
                category: {
                    label: {
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                    },
                    line: {
                        stroke: theme === 'dark' ? '#555555' : '#e0e0e0',
                    },
                },
                number: {
                    label: {
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                    },
                    line: {
                        stroke: theme === 'dark' ? '#555555' : '#e0e0e0',
                    },
                    gridLine: {
                        stroke: theme === 'dark' ? '#555555' : '#e0e0e0',
                    },
                },
            },
        },
    } as any;

    // AG Grid row class function
    const getRowClass = (params: any) => {
        if (params.node.rowPinned) {
            return 'bg-primary/10 font-medium';
        }
        return '';
    };

    // AG Grid row id function
    const getRowId = (params: any) => {
        return params.data.id || params.data.ticketno || params.data._id || String(params.node.id);
    };

    // Talep detaylarını açma fonksiyonu
    const getDetails = (ticketId: string, ticketNo: string) => {
        const TabID = `ticket-${ticketNo}`;
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = useTabStore.getState().tabs.some(tab => tab.id === TabID)

        if (!isTabAlreadyOpen) {
            addTab({
                id: TabID,
                title: `Talep #${ticketNo}`,
                lazyComponent: () => import('@/app/[tenantId]/(main)/tickets/detail/page').then(module => ({
                    default: (props: any) => <module.default {...props} ticketId={ticketId} forceRefresh={true} />
                }))
            })
        } else {
            // Sekme zaten açıksa, önbelleği temizle
            try {
                const { clearTicketCache } = require('@/app/[tenantId]/(main)/tickets/detail/page');
                clearTicketCache(ticketId);
            } catch (error) {
                console.error("Önbellek temizleme hatası:", error);
            }
        }
        setActiveTab(TabID)
    };

    // Hücre tıklama olayı
    const onCellClicked = (params: CellClickedEvent) => {
        // Sadece ticketno sütununa tıklandığında ve pinned row olmadığında çalış
        if (params.column.getColId() === 'ticketno' && !params.node.rowPinned) {
            const ticketNo = params.value;
            const ticketId = params.data.id;
            
            if (ticketId && ticketNo) {
                getDetails(ticketId, ticketNo);
            }
        }
    };

    // AG Grid pinned bottom row data
    const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);

    // Veri yükleme fonksiyonu - Store'u kullanmadan doğrudan çalışacak
    const fetchTicketsDirectly = useCallback(async () => {
        // Aktif tab kontrolü
        if (activeTab !== TAB_NAME) {
            return;
        }

        try {
            setLocalIsLoading(true);
            setError(null);
            setCurrentStep("Veriler getiriliyor...");
            const latestFilter = useTabStore.getState().getTabFilter(activeTab);

            const response = await axios.post('/api/main/reports/alltickets', {
                date1: latestFilter?.date?.from || '2020-01-01',
                date2: latestFilter?.date?.to || new Date().toISOString(),
            });
            
            if (response.data) {
                // Verileri doğrudan state'e kaydet
                setRowData(response.data);
                setPinnedBottomRowData([
                    {
                        ticketno: `Toplam: ${response.data.length} kayıt`,
                    }
                ]);
            }
        } catch (err: any) {
            console.error('Error loading tickets:', err);
            setError(err.response?.data?.message || 'Destek talepleri yüklenemedi');
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
            // Veri yükleme tamamlandı işareti
            dataLoadedRef.current = true;
        }
    }, [activeTab, TAB_NAME]);

    // Veri yükleme ve tab değişikliği izleme - TAB DEĞİŞİMİNDE VERİ KORUMA İÇİN DÜZELTİLDİ
    useEffect(() => {
        // Tab aktif olduğunda ve veri henüz yüklenmemişse yükle
        if (activeTab === TAB_NAME && !dataLoadedRef.current) {
            fetchTicketsDirectly();
        }
        
        // Global window fonksiyonu olarak refreshTicketList'i tanımla
        window.refreshTicketList = () => {
            if (activeTab === TAB_NAME) {
                // Manuel tetiklendiğinde dataLoadedRef'i false yap ve veriyi yenile
                dataLoadedRef.current = false;
                return fetchTicketsDirectly();
            }
            return Promise.resolve();
        };
        
        return () => {
            // Component unmount olduğunda global fonksiyonu temizle
            window.refreshTicketList = undefined;
        };
    }, [activeTab, fetchTicketsDirectly, TAB_NAME]);
    
    // Component ilk mount olduğunda çalışır
    useEffect(() => {
        // Sayfa yüklendiğinde activeTab'i güncelle
        setActiveTab(TAB_NAME)
        
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
        }
        
        // Component komple unmount olduğunda (sayfadan çıkıldığında) veri durumunu sıfırla
        return () => {
            dataLoadedRef.current = false;
        };
    }, [setActiveTab, TAB_NAME]);

    // Sadece filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (activeTab === TAB_NAME && selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt;
            // Filtre değiştiğinde dataLoadedRef'i sıfırla ve yeni veri yükle
            dataLoadedRef.current = false;
            fetchTicketsDirectly();
        }
    }, [selectedFilter.appliedAt, activeTab, TAB_NAME, fetchTicketsDirectly]);
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <>
                {localIsLoading && <LoadingOverlay currentStep={currentStep} />}
                <div className="flex-grow">
                    {error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <h3 className="text-lg font-medium">Bir hata oluştu</h3>
                                <p className="text-sm text-muted-foreground">{error}</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => fetchTicketsDirectly()}
                                >
                                    Tekrar Dene
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className={cn(
                                "ag-theme-alpine h-full w-full rounded-md border",
                                theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
                            )}
                        >
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                autoGroupColumnDef={autoGroupColumnDef}
                                enableRangeSelection={true}
                                enableCharts={true}
                                rowSelection="multiple"
                                enableCellTextSelection={true}
                                getRowClass={getRowClass}
                                getRowId={getRowId}
                                suppressPaginationPanel={false}
                                animateRows={true}
                                onCellClicked={onCellClicked}
                                noRowsOverlayComponent={NoRowsOverlay}
                                loadingOverlayComponent={LoadingOverlay}
                                pinnedBottomRowData={pinnedBottomRowData}
                                enableCellChangeFlash={true}
                                popupParent={document.body}
                                pagination={true}
                                paginationPageSize={50}
                                paginationPageSizeSelector={[10, 25, 50, 100, 250, 500]}
                                sideBar={sideBar}
                                statusBar={{
                                    statusPanels: [
                                        { statusPanel: 'agTotalRowCountComponent', align: 'left' },
                                        { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
                                    ]
                                }}
                                context={{ theme }}
                                rowGroupPanelShow="always"
                                groupDisplayType="multipleColumns"
                                groupDefaultExpanded={1}
                            />
                        </div>
                    )}
                </div>
            </>
        </div>
    )
}