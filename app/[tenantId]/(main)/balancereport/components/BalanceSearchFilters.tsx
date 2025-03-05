"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface BalanceSearchFiltersProps {
    searchTerm: string
    setSearchTerm: (value: string) => void
}

export function BalanceSearchFilters({ searchTerm, setSearchTerm }: BalanceSearchFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4">
            <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-2 border-blue-100/50 dark:border-blue-900/20 shadow-lg shadow-blue-500/5">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                                <Input
                                    placeholder="Müşteri ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white/80 dark:bg-gray-800/80 border-2 border-blue-100 dark:border-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
