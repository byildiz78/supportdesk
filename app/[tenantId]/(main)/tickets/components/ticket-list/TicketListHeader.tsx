"use client"

import * as React from "react"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, User, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"

export type SortField = 'ticketno' | 'title' | 'description' | 'priority' | 'status' | 'createdAt' | 'assignedUserName' | 'companyName' | 'customerName' | 'source' | 'elapsedTime' | 'dueDate'
export type SortDirection = 'asc' | 'desc'

interface TicketListHeaderProps {
    sortField: SortField
    sortDirection: SortDirection
    onSort: (field: SortField) => void
    showStatusColumn?: boolean
}

export function TicketListHeader({ sortField, sortDirection, onSort, showStatusColumn = true }: TicketListHeaderProps) {
    // Render sort indicator
    const renderSortIndicator = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1 h-4 w-4" />
        }
        
        return sortDirection === 'asc' 
            ? <ChevronUp className="ml-1 h-4 w-4" />
            : <ChevronDown className="ml-1 h-4 w-4" />
    }

    return (
        <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
            <TableRow className="whitespace-nowrap">
                <TableHead 
                    className="w-[60px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('ticketno')}
                >
                    <div className="flex items-center">
                        <span>No</span>
                        {renderSortIndicator('ticketno')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[120px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('title')}
                >
                    <div className="flex items-center">
                        <span>Başlık</span>
                        {renderSortIndicator('title')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[120px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('description')}
                >
                    <div className="flex items-center">
                        <span>Açıklama</span>
                        {renderSortIndicator('description')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[100px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('companyName')}
                >
                    <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span>Firma</span>
                        {renderSortIndicator('companyName')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[100px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('customerName')}
                >
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>İletişim</span>
                        {renderSortIndicator('customerName')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('source')}
                >
                    <div className="flex items-center">
                        <span>Kaynak</span>
                        {renderSortIndicator('source')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('priority')}
                >
                    <div className="flex items-center">
                        <span>Öncelik</span>
                        {renderSortIndicator('priority')}
                    </div>
                </TableHead>
                {showStatusColumn && (
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('status')}
                >
                    <div className="flex items-center">
                        <span>Durum</span>
                        {renderSortIndicator('status')}
                    </div>
                </TableHead>
                )}
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('assignedUserName')}
                >
                    <div className="flex items-center">
                        <span>Atanan</span>
                        {renderSortIndicator('assignedUserName')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('createdAt')}
                >
                    <div className="flex items-center">
                        <span>Oluşturma</span>
                        {renderSortIndicator('createdAt')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[80px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('elapsedTime')}
                >
                    <div className="flex items-center">
                        <span>Süre</span>
                        {renderSortIndicator('elapsedTime')}
                    </div>
                </TableHead>
                <TableHead 
                    className="w-[60px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => onSort('dueDate')}
                >
                    <div className="flex items-center">
                        <span>SLA</span>
                        {renderSortIndicator('dueDate')}
                    </div>
                </TableHead>
                <TableHead className="w-[60px]">İşlemler</TableHead>
            </TableRow>
        </TableHeader>
    )
}
