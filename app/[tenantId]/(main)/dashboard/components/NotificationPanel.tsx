import { motion } from "framer-motion";
import PulseLoader from "react-spinners/PulseLoader";
import { Bell, CheckCircle2, Ban, Tag, AlertCircle, ArrowUpRight, Clock, RefreshCw, ClipboardCheck, MapPin, CalendarDays, ReceiptText, ShoppingCart, Wallet, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";
import { NotificationType } from "@/types/tables";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFilterStore } from "@/stores/filters-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";

interface NotificationStyle {
    icon: typeof CheckCircle2;
    color: string;
    borderColor: string;
    bgColor: string;
}

interface NotificationPanelProps {
    refreshTrigger: number;
}

interface Notification {
    Debit: number;
    BranchName: number;
    CustomerName: string;
    Date: string;
    CheckNo: number;
    SaleType?: string;
 }

const SALE_TYPE_STYLES: Record<string, NotificationStyle> = {
    Sale: {
        icon: ShoppingCart,
        color: "text-blue-600",
        borderColor: "border-blue-500/30",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    Collection: {
        icon: Wallet,
        color: "text-emerald-600",
        borderColor: "border-emerald-500/30",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    Other: {
        icon: HelpCircle,
        color: "text-gray-600",
        borderColor: "border-gray-500/30",
        bgColor: "bg-gray-50 dark:bg-gray-800",
    },
};

export default function NotificationPanel({
    refreshTrigger
}: NotificationPanelProps) {
    const { selectedFilter } = useFilterStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [intervalLoading, setIntervalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const { activeTab } = useTabStore();


    const fetchNotifications = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            } else {
                setIntervalLoading(true);
            }
            setError(null);

            const { data } = await axios.get('/api/notifications');

            setNotifications(Array.isArray(data) ? data : []);
            setHasFetched(true);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        } finally {
            setLoading(false);
            setIntervalLoading(false);
        }
    },[]);

    // Handle refreshes based on refreshTrigger
    useEffect(() => {
        if (activeTab === "dashboard" && refreshTrigger > 0) {
            fetchNotifications(false);
        }
    }, [refreshTrigger, activeTab , fetchNotifications]);

    // İlk yüklemede bildirimleri çek
    useEffect(() => {
        if (activeTab === "dashboard" && !hasFetched) {
            fetchNotifications(true);
        }
    }, [activeTab, hasFetched, fetchNotifications]);

    const renderNotification = useCallback((notification: Notification, index: number, isLastItem: boolean) => {
        const gradients = {
            0: "from-blue-600 to-indigo-600",
            1: "from-indigo-600 to-purple-600",
            2: "from-purple-600 to-pink-600",
            3: "from-pink-600 to-rose-600",
            4: "from-rose-600 to-orange-600",
            5: "from-orange-600 to-amber-600",
        }

        const bgGradients = {
            0: "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40",
            1: "from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40",
            2: "from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40",
            3: "from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40",
            4: "from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40",
            5: "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40",
        }

        const gradientIndex = index % 6
        const gradient = gradients[gradientIndex as keyof typeof gradients]
        const bgGradient = bgGradients[gradientIndex as keyof typeof bgGradients]

        const saleTypeStyle = notification.SaleType ? SALE_TYPE_STYLES[notification.SaleType] : SALE_TYPE_STYLES.Other;

        return (
            <Card
                key={notification.CheckNo}
                className={cn(
                    "group relative overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-gray-900/40",
                    "hover:-translate-y-0.5",
                    "bg-gradient-to-br",
                    bgGradient,
                    "border-0",
                    "mb-4"
                )}
            >
                <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-70"
                        style={{
                            backgroundImage: `linear-gradient(to bottom, var(--${gradient.split(' ')[0]}-color), var(--${gradient.split(' ')[2]}-color))`
                        }} />

                    <div className="pl-3 pr-3 py-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="font-medium text-[13px] text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                            {notification.BranchName || 'İsimsiz'} Nolu Şube
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm">{notification.BranchName} Nolu Şube</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">                
                                <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide",
                                    "bg-gradient-to-r",
                                    gradient,
                                    "text-white shadow-sm"
                                )}>
                                    {notification.SaleType && (
                                        <>
                                            <saleTypeStyle.icon className="w-2.5 h-2.5 mr-1" />
                                            {notification.SaleType === "Sale" ? (
                                                <>Satış</>
                                            ) : notification.SaleType === "Collection" ? (
                                                <>Tahsilat</>
                                            ) : (
                                                <>Diğer</>
                                            )}
                                            <span className="mx-1">•</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <Avatar className={cn(
                                "w-8 h-8 text-xs relative transition-all duration-300",
                                "group-hover:scale-110",
                                "bg-gradient-to-br shadow-md",
                                gradient,
                                "text-white flex items-center justify-center"
                            )}>
                                <ReceiptText className="h-4 w-4" />
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(notification.Date).toLocaleTimeString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                        <span className="mx-1">•</span>
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            <span>{new Date(notification.Date).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long'
                                            })}</span>
                                        </div>
                                    </div>

                                    <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        {notification.CustomerName}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                            <ClipboardCheck className="w-3 h-3" />
                                            <span>Çek No: {notification.CheckNo}</span>
                                        </div>
                                        
                                        <div className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(notification.Debit)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-none py-6 px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bildirimler</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => fetchNotifications()}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {intervalLoading ? (
                                    <PulseLoader color="currentColor" size={3} />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-sm">Bildirimleri yenile</p>
                        </TooltipContent>
                    </Tooltip>
                    {/* <SettingsMenu settings={tempSettings} setSettings={setTempSettings} /> */}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80"
            >
                {loading ? (
                    <div className="flex justify-center py-10">
                        <PulseLoader color="currentColor" size={8} />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                        <p>{error}</p>
                        <button
                            onClick={() => fetchNotifications(true)}
                            className="mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Yeniden dene
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <Bell className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                        <p>Son 24 saat içinde bildirim yok</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {notifications.map((notification, index) => renderNotification(
                            notification,
                            index,
                            index === notifications.length - 1
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}