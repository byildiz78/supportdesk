"use client"

import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export-utils"

export function SalesHeader() {
    const formatSalesData = (data: any[]) => {
        return data.map(item => ({
            'Tarih': item.date,
            'Müşteri Adı': item.customerName,
            'Çek No': item.documentNo,
            'Tutar': item.amount
        }));
    };

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Satış İşlemleri
                </h2>
                <p className="text-[0.925rem] text-muted-foreground">
                    Satış işlemlerini takip edin
                </p>
            </div>
        </div>
    )
}
