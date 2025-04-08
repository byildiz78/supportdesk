'use client'

import { useState, useEffect, useRef } from 'react'
import * as LucideIcons from 'lucide-react'
import { useFilterStore } from '@/stores/filters-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Database, Bot, Sparkles, Calendar, Building2, ArrowRight, ListFilter, CreditCard, Wallet, PlayCircle, BarChart, Download } from 'lucide-react'
import { SidebarMenu } from './components/sidebar-menu';
import { FilterInfo } from './components/filter-info';
import { LoadingAnimation } from './components/loading-animation';
import WelcomeScreen from './components/welcome-screen';
import { BalanceCard } from './components/balance-card';
import { MessageContent } from './components/message-content';
import { RawTable } from './components/raw-table';
import { DataCharts } from './components/data-charts';
import { ExportButton } from './components/export-button';
import { Balance, MenuItem } from './types';
import axios from '@/lib/axios';
import { ChatBot } from '@/pages/api/main/ai/analyser_menu_items';

export default function ChatBotComponent() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<Array<{ role: 'assistant', content: string }>>([])
    const [rawData, setRawData] = useState<any[] | null>(null)
    const [balanceData, setBalanceData] = useState<Balance | null>(null)
    const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { selectedFilter } = useFilterStore();

    const accumulatedDataRef = useRef('');
    const messageUpdateTimeoutRef = useRef<NodeJS.Timeout>();
    const scrollAnimationRef = useRef<number>();
    const isMounted = useRef(false);

    // Smooth scroll fonksiyonu
    const smoothScrollToBottom = () => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const targetScroll = container.scrollHeight - container.clientHeight;
        const startScroll = container.scrollTop;
        const distance = targetScroll - startScroll;
        const duration = 500; // ms cinsinden animasyon süresi
        let startTime: number | null = null;

        const animateScroll = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // Easing fonksiyonu (yavaşlayarak hareket)
            const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
            const easedProgress = easeOutCubic(progress);

            if (container) {
                container.scrollTop = startScroll + (distance * easedProgress);
            }

            if (progress < 1) {
                scrollAnimationRef.current = requestAnimationFrame(animateScroll);
            }
        };

        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    };

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (messageUpdateTimeoutRef.current) {
                clearTimeout(messageUpdateTimeoutRef.current);
            }
            if (scrollAnimationRef.current) {
                cancelAnimationFrame(scrollAnimationRef.current);
            }
        };
    }, []);

    // Her mesaj güncellemesinde smooth scroll'u tetikle
    useEffect(() => {
        if (messages.length > 0) {
            smoothScrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        const fetchMenuItems = async () => {
            if (!isMounted.current) return;

            try {
                const response = await axios.get('/api/main/ai/analyser_menu_items');
                if (!response) throw new Error('Failed to fetch menu items');
                const data = await response.data;

                if (!isMounted.current) return;

                const transformedItems = data.map((item: ChatBot) => {
                    const IconComponent = (LucideIcons as any)[item.Icon] || LucideIcons.HandCoins;
                    return {
                        id: item.ChatBotID,
                        title: item.AnalysisTitle,
                        icon: <IconComponent className="w-4 h-4" />,
                        bgColor: '',
                        textColor: ''
                    };
                });

                setMenuItems(transformedItems);
            } catch (error) {
                if (isMounted.current) {
                    setError(error instanceof Error ? error.message : 'Failed to fetch menu items');
                }
            }
        };

        fetchMenuItems();
    }, []);

    const handleAnalyze = async (menuId: string) => {
        if (!menuId || !isMounted.current) return;

        setIsLoading(true);
        setError(null);
        setMessages([]);
        setRawData(null);
        setBalanceData(null);
        setSelectedMenu(menuId);
        accumulatedDataRef.current = '';

        try {
            setMessages([{ role: 'assistant', content: '' }]);

            const response = await axios.post("/api/main/ai/analyser", {
                ChatBotID: menuId,
                date1: selectedFilter.date.from,
                date2: selectedFilter.date.to,
                branches: selectedFilter.selectedBranches.length > 0 
                    ? selectedFilter.selectedBranches.map(item => item.BranchID) 
                    : selectedFilter.branches.map(item => item.BranchID) || []
            }, {
                responseType: 'text',
                onDownloadProgress: (progressEvent) => {
                    if (!isMounted.current) return;

                    const newData = progressEvent.event.target.responseText.slice(accumulatedDataRef.current.length);
                    accumulatedDataRef.current = progressEvent.event.target.responseText;
                    
                    const lines = newData.split('\n');
                    let hasUpdates = false;
                    let newContent = '';
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonData = JSON.parse(line.slice(6));

                                if (jsonData.balance) {
                                    setBalanceData(jsonData.balance);
                                } else {
                                    if (jsonData.rawData) {
                                        setRawData(jsonData.rawData);
                                    }

                                    if (jsonData.content) {
                                        hasUpdates = true;
                                        // İçeriği olduğu gibi koru, ek işlem yapma
                                        // Bu sayede Türkçe karakterler ve markdown formatı korunur
                                        newContent += jsonData.content;
                                        
                                        // Tablo içeriği için hata ayıklama
                                        if (jsonData.content.includes('|') && jsonData.content.includes('\n')) {
                                            // Tablo içeriğini tespit et
                                            const lines = jsonData.content.split('\n');
                                            const tableLines = lines.filter(line => 
                                                line.trim().startsWith('|') && line.trim().endsWith('|')
                                            );
                                            
                                            if (tableLines.length > 0) {
                                                // Tablo formatını kontrol et
                                                const columnCounts = tableLines.map(row => {
                                                    const cells = row.split('|').filter(cell => cell.trim() !== '');
                                                    return cells.length;
                                                });
                                                
                                                const isConsistent = columnCounts.every(count => count === columnCounts[0]);
                                                if (!isConsistent) {
                                                    console.debug('⚠️ Uyarı: Sütun sayısı tutarsız!', columnCounts);
                                                }
                                            }
                                            
                                            // Tamamlanmamış tablo kontrolü
                                            if (jsonData.content.includes('|') && 
                                                !jsonData.content.trim().endsWith('|') && 
                                                jsonData.content.trim().includes('\n')) {
                                                console.debug('Olası tamamlanmamış tablo tespit edildi');
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('Error parsing SSE message:', e);
                            }
                        }
                    }

                    // Mesaj güncellemelerini birleştir
                    if (hasUpdates) {
                        if (messageUpdateTimeoutRef.current) {
                            clearTimeout(messageUpdateTimeoutRef.current);
                        }

                        messageUpdateTimeoutRef.current = setTimeout(() => {
                            if (isMounted.current) {
                                setMessages(prev => [{
                                    role: 'assistant',
                                    content: prev[0].content + newContent
                                }]);
                                setIsLoading(false);
                            }
                        }, 50); // Daha sık güncelleme için süreyi azalttım
                    }
                }
            });

            if (response.status !== 200) {
                throw new Error('Analysis failed');
            }
        } catch (error) {
            if (isMounted.current) {
                setError(error instanceof Error ? error.message : 'An error occurred');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex h-screen">
            <SidebarMenu menuItems={menuItems} selectedMenu={selectedMenu} isLoading={isLoading} onMenuSelect={setSelectedMenu} />
            <div className="flex-1 px-4 h-full w-[calc(80vw-20rem)] overflow-hidden">
                <FilterInfo selectedMenu={selectedMenu} isLoading={isLoading} handleAnalyze={handleAnalyze} />
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl">
                        <LoadingAnimation />
                    </div>
                ) : messages.length > 0 || rawData || balanceData ? (
                    <Tabs defaultValue="analysis" className="w-full mt-4">
                        <TabsList className="mb-4">
                            <TabsTrigger
                                value="analysis"
                                icon={<MessageSquare className="w-4 h-4" />}
                            >
                                Yapay Zeka Analizi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent 
                            ref={containerRef}
                            value="analysis" 
                            className='max-h-[60vh] overflow-y-auto
                            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-transparent
                            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80'>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                                    <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Yapay Zeka Analiz Sonucu
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Seçili tarih aralığı ve şubeler için analiz raporu
                                    </p>
                                </div>
                                {messages.length > 0 && (
                                    <ExportButton 
                                        contentRef={containerRef} 
                                        fileName={menuItems.find(item => item.id === selectedMenu)?.title || 'ai-analiz-raporu'}
                                    />
                                )}
                            </div>

                            {messages.map((message, index) => (
                                <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 shadow-md border border-blue-100/50 dark:border-blue-900/30">
                                    <MessageContent message={message} />
                                    {balanceData && balanceData.is_available && (
                                        <BalanceCard balanceData={balanceData} />
                                    )}
                                </div>
                            ))}

                        </TabsContent>

                        <TabsContent value="data" className='max-h-[60vh] overflow-y-auto
                            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-transparent
                            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80'>
                            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
                                        <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Ham Veri Görünümü
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Analiz için kullanılan kaynak veriler
                                        </p>
                                    </div>
                                </div>
                                {(rawData && rawData.length !== 0) && <RawTable data={rawData} />}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="charts" className='max-h-[60vh] overflow-y-auto
                            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-transparent
                            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80'>
                            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/20">
                                        <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Veri Grafikleri
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Analiz verilerinin görsel temsili
                                        </p>
                                    </div>
                                </div>
                                <DataCharts data={rawData} />
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <WelcomeScreen />
                )}
            </div>
        </div>
    );
}