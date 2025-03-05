"use client"

import { Button } from "@/components/ui/button"

interface BalancePaginationProps {
    currentPage: number
    totalPages: number
    totalBalances: number
    setCurrentPage: (page: number) => void
}

export function BalancePagination({ 
    currentPage,
    totalPages,
    totalBalances,
    setCurrentPage
}: BalancePaginationProps) {
    return (
        <div className="py-1.5 px-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Toplam {totalBalances} kayıt
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-4"
                    >
                        Önceki
                    </Button>
                    <div className="flex items-center gap-2 min-w-[5rem] justify-center">
                        <span className="font-medium">{currentPage}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{totalPages}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-4"
                    >
                        Sonraki
                    </Button>
                </div>
            </div>
        </div>
    )
}
