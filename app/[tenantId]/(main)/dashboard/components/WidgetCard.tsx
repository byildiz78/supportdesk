import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ScaleLoader from "react-spinners/ScaleLoader";
import * as LucideIcons from "lucide-react";
import axios from "@/lib/axios";

import { useFilterStore } from "@/stores/filters-store";
import { useTabStore } from '@/stores/tab-store';

const gradientColors = [
    {
        bg: "from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20",
        border: "border-l-indigo-500",
        text: "from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
        iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
        bg: "from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20",
        border: "border-l-purple-500",
        text: "from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400",
        iconBg: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
        bg: "from-pink-50/50 to-rose-50/50 dark:from-pink-950/20 dark:to-rose-950/20",
        border: "border-l-pink-500",
        text: "from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400",
        iconBg: "bg-pink-100 dark:bg-pink-900/30",
        iconColor: "text-pink-600 dark:text-pink-400"
    },
    {
        bg: "from-rose-50/50 to-orange-50/50 dark:from-rose-950/20 dark:to-orange-950/20",
        border: "border-l-rose-500",
        text: "from-rose-600 to-orange-600 dark:from-rose-400 dark:to-orange-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/30",
        iconColor: "text-rose-600 dark:text-rose-400"
    }
];

const DynamicIcon = ({ iconName, className }:any) => {
    if (!iconName) return null;
    const IconComponent = LucideIcons[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
};

const formatMainValue = (value: any) => {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : Math.floor(num).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
    }
    return Math.floor(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
};

const WidgetCard = memo(function WidgetCard({
    reportId,
    reportName,
    reportIcon,
    columnIndex = 0,
}) {
    const [widgetData, setWidgetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const isInitialLoadDone = useRef(false);
    const isFirstFilterEffect = useRef(true);
    const lastFetchTimeRef = useRef<number>(0);
    const REFRESH_INTERVAL = 90000; // 90 saniye
    const { selectedFilter } = useFilterStore();
    const colorSet = useMemo(() => gradientColors[columnIndex % gradientColors.length], [columnIndex]);
    const { tabs, activeTab } = useTabStore();

    const selectedBranches = useMemo(() =>
        selectedFilter.selectedBranches.length <= 0
            ? selectedFilter.branches
            : selectedFilter.selectedBranches,
        [selectedFilter.selectedBranches, selectedFilter.branches]
    );
    
    
    const getReportData = useCallback(async (isInitial = false) => {
        if (selectedBranches.length === 0) {
            setIsLoading(false);
            setIsUpdating(false);
            return;
        }
        
        try {
            if (isInitial) {
                setIsLoading(true);
            } else {
                setIsUpdating(true);
            }
            
            const response = await axios.post("/api/widgetreport", {
                date1: selectedFilter.date.from,
                date2: selectedFilter.date.to,
                branches: selectedBranches.map((item) => item.BranchID),
                reportId,
            });
            
            if (response.status === 200 && response.data && response.data[0]) {
                setWidgetData(response.data[0]);
            } else {
                console.error(`Invalid response format for widget ${reportId}:`, response);
                setWidgetData(null);
            }
        } catch (err) {
            console.error(`Error fetching data for widget ${reportId}:`, err);
            setWidgetData(null);
        } finally {
            if (isInitial) {
                setIsLoading(false);
            } else {
                setIsUpdating(false);
            }
        }
    }, [selectedFilter.date, selectedBranches, reportId]);

    // İlk useEffect - Tab değişimi için
    useEffect(() => {
        let isSubscribed = true;
        let intervalId;

        if (activeTab === "dashboard" && !isInitialLoadDone.current) {
            isInitialLoadDone.current = true;
            getReportData(true);
        }

        if (activeTab === "dashboard") {
            intervalId = setInterval(() => {
                if (isSubscribed) {
                    getReportData(false);
                }
            }, REFRESH_INTERVAL);
        }

        return () => {
            isSubscribed = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [activeTab]);

    // İkinci useEffect - Filtre değişimleri için
    useEffect(() => {
        if (isFirstFilterEffect.current) {
            isFirstFilterEffect.current = false;
            return;
        }

        if (activeTab === "dashboard") {
            getReportData(false);
        }
    }, [selectedFilter.date, selectedBranches]);

    return (
        <Card className={cn(
            "group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5",
            "border-l-[6px]",
            "bg-gradient-to-br shadow-lg",
            colorSet.bg,
            colorSet.border,
            `shadow-${colorSet.border.split('-').pop()}/10 dark:shadow-${colorSet.border.split('-').pop()}/20`
        )}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium">
                        {reportName}
                    </h3>
                    <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                        colorSet.iconBg
                    )}>
                        <DynamicIcon iconName={reportIcon} className={cn("h-4 w-4", colorSet.iconColor)} />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                        <div className={cn(
                            "text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            colorSet.text
                        )}>
                            {isLoading || isUpdating ? (
                                <div className="transform scale-50 -ml-2">
                                    <ScaleLoader color="#6366f1" height={20} />
                                </div>
                            ) : (
                                formatMainValue(widgetData?.reportValue1 || 0)
                            )}
                        </div>
                        {/* {(showValue2 || isLoading || isUpdating) && (
                            <span className="text-xs text-muted-foreground">
                                {isLoading || isUpdating ? (
                                    <div className="transform scale-50">
                                        <ScaleLoader color="#6366f1" height={15} />
                                    </div>
                                ) : (
                                    formatNumberIntl(widgetData?.reportValue2)
                                )}
                            </span>
                        )} */}
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                        <motion.div
                            className={cn(
                                "h-full w-full bg-gradient-to-r rounded-full",
                                colorSet.text
                            )}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                                opacity: 0.3,
                            }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
});

export default WidgetCard;