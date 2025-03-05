"use client"

import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Users,
    Settings,
    Filter
} from 'lucide-react'

interface CustomerTableProps {
    customers: any[];
}

export function CustomerTable({
    customers
}: CustomerTableProps) {
    return (
        <div className="flex-1 overflow-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-transparent
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
            <Table className="relative w-full">
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Segment Adı
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </span>
                                Müşteri Sayısı
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </span>
                                Kurallar
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%] text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Filter className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </span>
                                Durum
                            </div>
                        </TableHead>
                        <TableHead className="w-[5%] text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </span>
                                İşlemler
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Filter className="h-12 w-12 text-gray-400 mb-4" />
                                    <div className="text-lg font-medium text-gray-600 dark:text-gray-300">Henüz Segment Oluşturulmamış</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Yeni bir segment oluşturmak için "Yeni Segment" butonunu kullanın.</div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        customers.map((segment) => (
                            <TableRow
                                key={segment.id}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                            >
                                <TableCell>
                                    <div className="font-medium">{segment.name}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{segment.customerCount}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {segment.rules.map((rule: string, index: number) => (
                                            <Badge 
                                                key={index}
                                                variant="outline" 
                                                className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                            >
                                                {rule}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge 
                                        variant="outline"
                                        className={cn(
                                            segment.isActive 
                                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800"
                                        )}
                                    >
                                        {segment.isActive ? "Aktif" : "Pasif"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <MoreHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuItem>
                                                <Eye className="h-4 w-4 mr-2 text-indigo-600" /> Detayları Görüntüle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2 text-blue-600" /> Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                                                <Trash2 className="h-4 w-4 mr-2" /> Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}