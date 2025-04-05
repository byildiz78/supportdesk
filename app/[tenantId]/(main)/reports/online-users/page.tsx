"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useOnlineUsersStore } from "@/stores/online-users-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/providers/theme-provider"
import { useTabStore } from "@/stores/tab-store"

// AG Grid imports
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, CellClickedEvent } from 'ag-grid-community'
import 'ag-grid-enterprise'

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
                <p className="text-sm text-muted-foreground">Şu anda çevrimiçi kullanıcı bulunmuyor.</p>
            </div>
        </div>
    );
};

// Durum hücre renderer bileşeni
const StatusCellRenderer = (props: any) => {
    const statusMap: Record<string, { label: string, color: string, indicatorColor: string }> = {
        'online': {
            label: 'Çevrimiçi',
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            indicatorColor: 'bg-green-500'
        },
        'away': {
            label: 'Uzakta',
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            indicatorColor: 'bg-yellow-500'
        },
        'busy': {
            label: 'Meşgul',
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            indicatorColor: 'bg-red-500'
        },
        'offline': {
            label: 'Çevrimdışı',
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            indicatorColor: 'bg-gray-500'
        }
    };

    const status = props.value || '';
    const { label, color, indicatorColor } = statusMap[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        indicatorColor: 'bg-gray-500'
    };

    return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color} inline-flex items-center justify-center gap-1.5`}>
            <span className={`h-2 w-2 rounded-full ${indicatorColor} ${status === 'online' ? 'animate-pulse' : ''}`}></span>
            {label}
        </div>
    );
};

// Son aktivite hücre renderer bileşeni
const LastHeartbeatCellRenderer = (props: any) => {
    if (!props.value) return null;

    const date = new Date(props.value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    let timeText = '';
    let statusClass = 'text-green-600 dark:text-green-400';

    if (diffMins < 1) {
        timeText = 'Şimdi';
    } else if (diffMins < 5) {
        timeText = `${diffMins} dakika önce`;
    } else if (diffMins < 60) {
        timeText = `${diffMins} dakika önce`;
        statusClass = 'text-yellow-600 dark:text-yellow-400';
    } else {
        const hours = Math.floor(diffMins / 60);
        if (hours < 24) {
            timeText = `${hours} saat önce`;
            statusClass = 'text-orange-600 dark:text-orange-400';
        } else {
            const days = Math.floor(hours / 24);
            timeText = `${days} gün önce`;
            statusClass = 'text-red-600 dark:text-red-400';
        }
    }

    const formattedDate = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="flex items-center gap-2">
            <span className="font-medium">{formattedDate}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${statusClass}`}>{timeText}</span>
        </div>
    );
};

// Window tipini genişlet
declare global {
    interface Window {
        // @ts-ignore
        refreshOnlineUsersList?: () => Promise<void>;
    }
}

export default function OnlineUsersPage() {
    const TAB_NAME = "Online Kullanıcılar"
    const { activeTab, setActiveTab } = useTabStore()
    const { users, isLoading, fetchOnlineUsers } = useOnlineUsersStore()
    const [currentStep, setCurrentStep] = useState("Veriler hazırlanıyor...")
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
    const [refreshInterval, setRefreshInterval] = useState(30) // saniye cinsinden
    const [localIsLoading, setLocalIsLoading] = useState(false)

    // Referanslar
    const hasInitializedRef = useRef(false)
    const dataLoadedRef = useRef(false)

    // Theme
    const { theme } = useTheme()

    // AG Grid column definitions
    const columnDefs: ColDef[] = [
        {
            headerName: 'Kullanıcı Adı',
            field: 'user_name',
            filter: 'agTextColumnFilter',
            minWidth: 180,
            flex: 1,
            sortable: true,
            headerClass: 'custom-header',
            cellClass: 'custom-cell',
            filterParams: {
                filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
                buttons: ['reset', 'apply'],
                closeOnApply: true
            }
        },
        {
            headerName: 'E-posta',
            field: 'email',
            filter: 'agTextColumnFilter',
            minWidth: 200,
            flex: 1,
            sortable: true,
            headerClass: 'custom-header',
            cellClass: 'custom-cell'
        },
        {
            headerName: 'Durum',
            field: 'status',
            filter: 'agSetColumnFilter',
            width: 120,
            headerClass: 'custom-header',
            cellRenderer: StatusCellRenderer,
            filterParams: {
                values: ['online', 'away', 'busy', 'offline'],
                suppressMiniFilter: false,
                buttons: ['reset', 'apply'],
                closeOnApply: true
            }
        },
        {
            headerName: 'Rol',
            field: 'role',
            filter: 'agTextColumnFilter',
            width: 150,
            sortable: true,
            headerClass: 'custom-header',
            cellClass: 'custom-cell'
        },
        {
            headerName: 'Departman',
            field: 'department',
            filter: 'agTextColumnFilter',
            width: 150,
            sortable: true,
            headerClass: 'custom-header',
            cellClass: 'custom-cell'
        },
        {
            headerName: 'Son Aktivite',
            field: 'last_heartbeat',
            filter: 'agDateColumnFilter',
            width: 240, // Genişliği artırıldı
            minWidth: 240, // Minimum genişlik tanımlandı
            flex: 0, // Flex değeri 0 yapıldı (sabit genişlik için)
            cellRenderer: LastHeartbeatCellRenderer,
            sort: 'desc',
            sortable: true,
            headerClass: 'custom-header',
            cellClass: 'last-heartbeat-cell', // Özel CSS sınıfı
            suppressSizeToFit: false // Kolonun otomatik boyutlandırılmasına izin ver
        }
    ];

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
                text: 'Kullanıcı Durumu Raporu',
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
        if (!params.data) return '';

        switch (params.data.status) {
            case 'online':
                return 'bg-green-50/50 dark:bg-green-900/5 hover:bg-green-50 dark:hover:bg-green-900/10';
            case 'away':
                return 'bg-yellow-50/50 dark:bg-yellow-900/5 hover:bg-yellow-50 dark:hover:bg-yellow-900/10';
            case 'busy':
                return 'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10';
            default:
                return 'hover:bg-gray-50 dark:hover:bg-gray-800/10';
        }
    };

    // AG Grid row id function
    const getRowId = (params: any) => {
        return params.data.id || params.data.user_id || String(params.node.id);
    };

    // Veri yükleme fonksiyonu - Store'u kullanarak ancak bağımsız çalışacak
    const loadData = useCallback(async () => {
        // Aktif tab kontrolü
        if (activeTab !== TAB_NAME) {
            return;
        }

        try {
            setLocalIsLoading(true);
            setCurrentStep("Çevrimiçi kullanıcılar getiriliyor...");
            await fetchOnlineUsers();
        } catch (err: any) {
            console.error('Error loading online users:', err);
        } finally {
            setLocalIsLoading(false);
            setCurrentStep("");
            // Veri yükleme tamamlandı işareti
            dataLoadedRef.current = true;
        }
    }, [activeTab, TAB_NAME, fetchOnlineUsers]);

    // Otomatik yenileme için interval
    useEffect(() => {
        if (autoRefreshEnabled && activeTab === TAB_NAME) {
            const interval = setInterval(() => {
                loadData();
            }, refreshInterval * 1000);

            return () => clearInterval(interval);
        }
    }, [autoRefreshEnabled, refreshInterval, loadData, activeTab, TAB_NAME]);

    // Veri yükleme ve tab değişikliği izleme
    useEffect(() => {
        // Tab aktif olduğunda ve veri henüz yüklenmemişse yükle
        if (activeTab === TAB_NAME && !dataLoadedRef.current) {
            loadData();
        }

        // Global window fonksiyonu olarak refreshOnlineUsersList'i tanımla
        window.refreshOnlineUsersList = () => {
            if (activeTab === TAB_NAME) {
                // Manuel tetiklendiğinde dataLoadedRef'i false yap ve veriyi yenile
                dataLoadedRef.current = false;
                return loadData();
            }
            return Promise.resolve();
        };

        return () => {
            // Component unmount olduğunda global fonksiyonu temizle
            window.refreshOnlineUsersList = undefined;
        };
    }, [activeTab, loadData, TAB_NAME]);

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

    // Yenileme aralığını değiştirme fonksiyonu
    const handleRefreshIntervalChange = (seconds: number) => {
        setRefreshInterval(seconds);
    };

    // Durum özeti hesaplama
    const statusSummary = {
        total: users.length,
        online: users.filter(u => u.status === 'online').length,
        away: users.filter(u => u.status === 'away').length,
        busy: users.filter(u => u.status === 'busy').length,
        offline: users.filter(u => u.status === 'offline').length
    };

    return (
        <div className="flex-1 p-4 md:p-6 h-[calc(85vh-4rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Online Kullanıcılar</h2>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        Sistemde aktif olan kullanıcıları izleyin (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs text-green-700 dark:text-green-400">{statusSummary.online} Çevrimiçi</span>
                        </div>
                        / {statusSummary.total} toplam)
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* <div className="flex items-center gap-2 text-xs border rounded-md py-1 px-3">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        <span className="text-green-700 dark:text-green-400">{statusSummary.online}</span>
                        <p className="text-green-700 dark:text-green-400">Online</p>
                    </div> */}
                    {/* <div className="flex items-center gap-2 text-xs border rounded-md py-1 px-3">
                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
                        <span className="text-yellow-700 dark:text-yellow-400">{statusSummary.away}</span>
                        <p className="text-yellow-700 dark:text-yellow-400">Uzakta</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs border rounded-md py-1 px-3">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
                        <span className="text-red-700 dark:text-red-400">{statusSummary.busy}</span>
                        <p className="text-red-700 dark:text-red-400">Meşgul</p>
                    </div> */}

                    <div className="flex items-center space-x-2 border rounded-md py-1 px-3">
                        <span className="text-sm">Yenileme:</span>
                        <Button
                            variant={autoRefreshEnabled ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                        >
                            {autoRefreshEnabled ? "Açık" : "Kapalı"}
                        </Button>

                        {autoRefreshEnabled && (
                            <div className="flex space-x-1">
                                {[10, 30, 60, 300].map((seconds) => (
                                    <Button
                                        key={seconds}
                                        variant={refreshInterval === seconds ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleRefreshIntervalChange(seconds)}
                                    >
                                        {seconds < 60 ? `${seconds}s` : `${seconds / 60}dk`}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={loadData}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={autoRefreshEnabled ? "animate-spin" : ""}
                        >
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                        </svg>
                        Yenile
                    </Button>
                </div>
            </div>

            <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
                {(isLoading || localIsLoading) && <LoadingOverlay currentStep={currentStep} />}
                <div
                    className={cn(
                        "ag-theme-alpine h-full w-full rounded-lg overflow-hidden",
                        theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
                    )}
                    style={{
                        // AG Grid özel CSS stilleri
                        '--ag-header-height': '48px',
                        '--ag-row-height': '48px',
                        '--ag-header-foreground-color': theme === 'dark' ? '#e2e8f0' : '#334155',
                        '--ag-header-background-color': theme === 'dark' ? '#1f2937' : '#f8fafc',
                        '--ag-odd-row-background-color': theme === 'dark' ? '#111827' : '#ffffff',
                        '--ag-row-border-color': theme === 'dark' ? '#374151' : '#e2e8f0',
                        '--ag-font-size': '14px',
                        '--ag-font-family': 'Inter, system-ui, sans-serif',
                    } as any}
                >
                    <AgGridReact
                        rowData={users}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        enableRangeSelection={true}
                        domLayout="normal"
                        enableCharts={true}
                        rowSelection="multiple"
                        enableCellTextSelection={true}
                        getRowClass={getRowClass}
                        getRowId={getRowId}
                        suppressPaginationPanel={false}
                        animateRows={true}
                        noRowsOverlayComponent={NoRowsOverlay}
                        loadingOverlayComponent={LoadingOverlay}
                        enableCellChangeFlash={true}
                        popupParent={document.body}
                        pagination={true}
                        paginationPageSize={25}
                        paginationPageSizeSelector={[10, 25, 50, 100]}
                        sideBar={sideBar}
                        statusBar={{
                            statusPanels: [
                                { statusPanel: 'agTotalRowCountComponent', align: 'left' },
                                { statusPanel: 'agSelectedRowCountComponent', align: 'left' }
                            ]
                        }}
                        context={{ theme }}
                        rowGroupPanelShow="always"
                        groupDisplayType="multipleColumns"
                        groupDefaultExpanded={1}
                        chartThemeOverrides={chartThemeOverrides}
                        rowHeight={48}
                        headerHeight={48}
                        tooltipShowDelay={300}
                        tooltipHideDelay={2000}
                        suppressContextMenu={false}
                        suppressClickEdit={true}
                        suppressCellFocus={false}
                        suppressMovableColumns={false}
                        suppressColumnMoveAnimation={false}
                        suppressRowClickSelection={false}
                        ensureDomOrder={true}
                        overlayNoRowsTemplate="Veri bulunamadı"
                        className="rounded-md"
                    />
                </div>
            </div>
        </div>
    )
}