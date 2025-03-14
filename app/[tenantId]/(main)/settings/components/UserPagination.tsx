"use client"

import { Button } from "@/components/ui/button"
import { 
    ChevronLeft, 
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react"

interface UserPaginationProps {
    currentPage: number
    totalPages: number
    totalUsers: number
    setCurrentPage: (page: number) => void
}

export function UserPagination({ 
    currentPage, 
    totalPages, 
    totalUsers,
    setCurrentPage 
}: UserPaginationProps) {
    return (
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-sm text-muted-foreground">
                Toplam {totalUsers} kullanıcı
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm mx-2">
                    Sayfa {currentPage} / {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
