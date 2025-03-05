"use client"

import { cn, formatCurrency } from "@/lib/utils"
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
import { CustomLoader } from "@/components/ui/custom-loader"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Eye,
    ShoppingCart,
    Receipt,
    FileText,
    FileSpreadsheet,
    CreditCard,
    Tag,
    User,
    Building2,
    Wallet,
    Star,
    AlertCircle
} from 'lucide-react'
import { useMemo } from "react"

interface CustomerTableProps {
    customers: any[];
    filteredCustomers: any[];
    onViewSaleModal: (customer: any) => void;
    onViewCollectionModal: (customer: any) => void;
    onViewStatement: (customer: any) => void;
    onViewDetailedStatement: (customer: any) => void;
    isLoading: boolean;
}

export function CustomerTable({
    customers,
    filteredCustomers,
    onViewSaleModal,
    onViewCollectionModal,
    onViewStatement,
    onViewDetailedStatement,
    isLoading
}: CustomerTableProps) {
    const totals = useMemo(() => {
        if (!filteredCustomers || filteredCustomers.length === 0) {
            return { balance: 0, earned: 0, used: 0 };
        }

        return filteredCustomers.reduce((acc, customer) => {
            let balance = 0;
            let earned = 0;
            let used = 0;
            
            try {
                if (customer.TotalBonusRemaing !== undefined) {
                    if (typeof customer.TotalBonusRemaing === 'number') {
                        balance = customer.TotalBonusRemaing;
                    } else if (typeof customer.TotalBonusRemaing === 'string') {
                        balance = parseFloat(customer.TotalBonusRemaing.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                if (customer.TotalBonusEarned !== undefined) {
                    if (typeof customer.TotalBonusEarned === 'number') {
                        earned = customer.TotalBonusEarned;
                    } else if (typeof customer.TotalBonusEarned === 'string') {
                        earned = parseFloat(customer.TotalBonusEarned.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                if (customer.TotalBonusUsed !== undefined) {
                    if (typeof customer.TotalBonusUsed === 'number') {
                        used = customer.TotalBonusUsed;
                    } else if (typeof customer.TotalBonusUsed === 'string') {
                        used = parseFloat(customer.TotalBonusUsed.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                balance = isNaN(balance) ? 0 : balance;
                earned = isNaN(earned) ? 0 : earned;
                used = isNaN(used) ? 0 : used;
            } catch (error) {
                console.error("Değer dönüştürme hatası:", error);
            }
            
            return { 
                balance: acc.balance + balance, 
                earned: acc.earned + earned, 
                used: acc.used + used
            };
        }, { balance: 0, earned: 0, used: 0 });
    }, [filteredCustomers]);

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
                        <TableHead className="w-[10%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </span>
                                Kart No
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Kart Tipi
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </span>
                                Müşteri Adı
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </span>
                                Şube
                            </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                </span>
                                Bakiye
                            </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                                    <Star className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                </span>
                                Alacak
                            </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </span>
                                Borç
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
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-[400px]">
                                <CustomLoader 
                                    message="Yükleniyor"
                                    description="Müşteri verileri hazırlanıyor..."
                                />
                            </TableCell>
                        </TableRow>
                    ) : customers?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="text-lg font-medium text-gray-600 dark:text-gray-300">Veri Bulunamadı</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Henüz müşteri kaydı bulunmamaktadır.</div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {customers?.map((customer) => (
                                <TableRow
                                    key={customer.customerId}
                                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                >
                                    <TableCell>
                                        <div className="font-medium">{customer.CardNumber}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                            {customer.CardType ? customer.CardType : `Belirtilmemiş`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{customer.CustomerName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium"> {customer.BranchID} Nolu Şube</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className={cn(
                                            "font-medium",
                                            customer.balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                        )}>
                                            {formatCurrency(customer.TotalBonusRemaing)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium text-blue-600 dark:text-blue-400">
                                            {formatCurrency(customer.TotalBonusEarned)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium text-red-600 dark:text-red-400">
                                            {formatCurrency(customer.TotalBonusUsed)}
                                        </div>
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
                                                <DropdownMenuItem onClick={() => onViewSaleModal(customer)}>
                                                    <ShoppingCart className="h-4 w-4 mr-2 text-green-600" /> Satış Girişi
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewCollectionModal(customer)}>
                                                    <Receipt className="h-4 w-4 mr-2 text-blue-600" /> Tahsilat Girişi
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewStatement(customer)}>
                                                    <FileText className="h-4 w-4 mr-2 text-purple-600" /> Ekstre
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewDetailedStatement(customer)}>
                                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-amber-600" /> Detaylı Ekstre
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2 text-indigo-600" /> Detayları Görüntüle
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {filteredCustomers.length > 0 && (
                                <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                                    <TableCell colSpan={4} className="text-right">
                                        <div className="font-bold">TOPLAM ({filteredCustomers.length} müşteri):</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className={cn(
                                            "font-bold",
                                            totals.balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                        )}>
                                            {formatCurrency(totals.balance)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-bold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(totals.earned)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(totals.used)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Boş hücre */}
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
