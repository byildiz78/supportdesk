"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ParentCompanyPaginationProps {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (items: number) => void
}

export function ParentCompanyPagination({
    currentPage,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange
}: ParentCompanyPaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    return (
        <div className="py-1.5 px-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Toplam {totalItems} ana firma
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 mr-4">
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
                            </SelectContent>
                        </Select>
                    </div>
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
