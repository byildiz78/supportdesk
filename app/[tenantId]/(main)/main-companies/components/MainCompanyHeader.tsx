"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTabStore } from "@/stores/tab-store"

export function MainCompanyHeader() {
    const { addTab, setActiveTab } = useTabStore()

    const handleNewCompany = () => {
        const tabId = "new-main-company"
        addTab({
            id: tabId,
            title: "Yeni Ana Firma",
            lazyComponent: () => import('../new/page').then(module => ({
                default: (props: any) => <module.default {...props} />
            }))
        })
        setActiveTab(tabId)
    }

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Ana Firmalar
                </h2>
                <p className="text-[0.925rem] text-muted-foreground">
                    Ana firma kayıtlarını yönetin
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleNewCompany}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30 transition-all duration-200 hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ana Firma
                </Button>
            </div>
        </div>
    )
}