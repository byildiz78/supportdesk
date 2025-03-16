"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface ContactPaginationProps {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (value: number) => void;
}

export function ContactPagination({
    currentPage,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange
}: ContactPaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <div className="border-t border-gray-100 dark:border-gray-800 p-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
                {totalItems > 0 ? (
                    <>
                        <span className="font-medium">{startItem}</span>
                        <span> - </span>
                        <span className="font-medium">{endItem}</span>
                        <span> / </span>
                        <span className="font-medium">{totalItems}</span>
                        <span> kişi gösteriliyor</span>
                    </>
                ) : (
                    <span>Kişi bulunamadı</span>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex items-center mr-4">
                    <span className="text-sm text-muted-foreground mr-2">Sayfa başına:</span>
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
                
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNumber: number;
                            
                            // Logic to show pages around current page
                            if (totalPages <= 5) {
                                pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                            } else {
                                pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                                <Button
                                    key={pageNumber}
                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onPageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </Button>
                            );
                        })}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
