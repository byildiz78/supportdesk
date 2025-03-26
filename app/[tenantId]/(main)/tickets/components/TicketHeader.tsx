"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTabStore } from "@/stores/tab-store"

interface TicketHeaderProps {
    title?: string;
    description?: string;
}

export function TicketHeader({ 
    title, 
    description 
}: TicketHeaderProps) {
    const { addTab, setActiveTab } = useTabStore()

    const handleNewTicket = () => {
        const tabId = "new-ticket"
        
        // Önce bu ID'ye sahip bir tab var mı kontrol et
        const tabs = useTabStore.getState().tabs
        const existingTab = tabs.find(tab => tab.id === tabId)
        
        if (existingTab) {
            // Tab zaten açıksa, sadece o taba geçiş yap
            setActiveTab(tabId)
        } else {
            // Tab yoksa yeni tab oluştur
            addTab({
                id: tabId,
                title: "Yeni Destek Talebi",
                lazyComponent: () => import('../crud-update/page').then(module => ({
                    default: (props: any) => <module.default {...props} />
                }))
            })
            setActiveTab(tabId)
        }
    }

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    {title ?? "Destek Talepleri"}
                </h2>
                <p className="text-[0.925rem] text-muted-foreground">
                    {description ?? "Tüm destek taleplerini yönetin ve takip edin"}
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleNewTicket}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30 transition-all duration-200 hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Talep
                </Button>
            </div>
        </div>
    )
}