"use client"

import { useTabStore } from "@/stores/tab-store"
import { Building2, Building, Users } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function CustomersPage() {
    const { addTab, setActiveTab } = useTabStore()

    const handleNavigation = (path: string, title: string) => {
        const tabId = path
        addTab({
            id: tabId,
            title: title,
            lazyComponent: () => import(`./${path}/page`).then(module => ({
                default: (props: any) => <module.default {...props} />
            }))
        })
        setActiveTab(tabId)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ana Firmalar */}
                <Card 
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                    onClick={() => handleNavigation('main-companies', 'Ana Firmalar')}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Ana Firmalar</h3>
                            <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Ana firma kayıtlarını yönetin</p>
                        </div>
                    </div>
                </Card>

                {/* Firmalar */}
                <Card 
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                    onClick={() => handleNavigation('companies', 'Firmalar')}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">Firmalar</h3>
                            <p className="text-sm text-purple-600/70 dark:text-purple-400/70">Firma kayıtlarını yönetin</p>
                        </div>
                    </div>
                </Card>

                {/* Kişiler */}
                <Card 
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                    onClick={() => handleNavigation('contacts', 'Kişiler')}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Kişiler</h3>
                            <p className="text-sm text-green-600/70 dark:text-green-400/70">Kişi kayıtlarını yönetin</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}