"use client"

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CustomerHeaderProps {
    onNewCustomer: () => void;
}

export function CustomerHeader({
    onNewCustomer
}: CustomerHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Müşteri Listesi
                </h2>
                <p className="text-[0.925rem] text-muted-foreground">
                    Müşteri kayıtlarını yönetin ve takip edin
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    Excel'e Aktar
                </Button>
                <Button
                    onClick={onNewCustomer}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30 transition-all duration-200 hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Müşteri
                </Button>
            </div>
        </div>
    )
}
