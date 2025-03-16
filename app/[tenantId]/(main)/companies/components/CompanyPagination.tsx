"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CompanyPaginationProps {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (value: number) => void
}

export function CompanyPagination({
    currentPage,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange
}: CompanyPaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return (
        <div className="py-1.5 px-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Toplam {totalItems} firma
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sayfa başına:</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={itemsPerPage.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 px-4"
                    >
                        Sonraki
                    </Button>
                </div>
            </div>
        </div>
    )
}