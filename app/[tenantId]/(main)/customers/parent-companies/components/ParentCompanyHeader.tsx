"use client"

import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { useTabStore } from "@/stores/tab-store"

export function ParentCompanyHeader() {
    const { addTab, setActiveTab } = useTabStore()
    
    const handleAddNewCompany = () => {
        const tabId = "new-parent-company"
        addTab({
            id: tabId,
            title: "Yeni Ana Firma",
            lazyComponent: () => import('../new/page')
        })
        setActiveTab(tabId)
    }
    
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h1 className="text-2xl font-bold tracking-tight">Ana Firmalar</h1>
                </div>
                <p className="text-muted-foreground">
                    Ana firma kayıtlarını görüntüleyin ve yönetin
                </p>
            </div>
            <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                onClick={handleAddNewCompany}
            >
                <Plus className="mr-2 h-4 w-4" /> Yeni Ana Firma
            </Button>
        </div>
    )
}
