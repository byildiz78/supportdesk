"use client"

import { Card } from "@/components/ui/card"
import { CustomLoader } from "@/components/ui/custom-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatDateTimeDMY } from "@/lib/utils"
import { formatDate } from "date-fns"
import { Calendar, FileText, User, Wallet } from "lucide-react"
import { useMemo } from "react"

interface TransactionTableProps {
    paginatedTransactions: any[]
    filteredTransactions: any[] 
    isLoading: boolean
}

export function TransactionTable({ paginatedTransactions, filteredTransactions, isLoading }: TransactionTableProps) {
    const totals = useMemo(() => {
        if (!filteredTransactions || filteredTransactions.length === 0) {
            return { credit: 0, debit: 0, balance: 0 };
        }
    
        return filteredTransactions.reduce((acc, transaction) => {
            let credit = 0;
            let debit = 0;
            let balance = 0;
            
            try {
                if (transaction.Credit) {
                    if (typeof transaction.Credit === 'number') {
                        credit = transaction.Credit;
                    } else if (typeof transaction.Credit === 'string') {
                        credit = parseFloat(transaction.Credit.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                if (transaction.Debit) {
                    if (typeof transaction.Debit === 'number') {
                        debit = transaction.Debit;
                    } else if (typeof transaction.Debit === 'string') {
                        debit = parseFloat(transaction.Debit.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                if (transaction.Balance) {
                    if (typeof transaction.Balance === 'number') {
                        balance = transaction.Balance;
                    } else if (typeof transaction.Balance === 'string') {
                        balance = parseFloat(transaction.Balance.replace(/\./g, '').replace(',', '.'));
                    }
                }
                
                credit = isNaN(credit) ? 0 : credit;
                debit = isNaN(debit) ? 0 : debit;
                balance = isNaN(balance) ? 0 : balance;
            } catch (error) {
                console.error("Değer dönüştürme hatası:", error);
            }
            
            return { 
                credit: acc.credit + credit, 
                debit: acc.debit + debit, 
                balance: acc.balance + balance  // Bakiye değerlerini topluyoruz
            };
        }, { credit: 0, debit: 0, balance: 0 });
    }, [filteredTransactions]);

    const formatNumber = (num: number) => {
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
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
                                <TableHead className="w-[15%]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </span>
                                        Tarih
                                    </div>
                                </TableHead>
                                <TableHead className="w-[25%]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </span>
                                        Cari
                                    </div>
                                </TableHead>
                                <TableHead className="w-[15%] text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </span>
                                        Alacak
                                    </div>
                                </TableHead>
                                <TableHead className="w-[15%] text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </span>
                                        Borç
                                    </div>
                                </TableHead>
                                <TableHead className="w-[15%] text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </span>
                                        Bakiye
                                    </div>
                                </TableHead>
                                <TableHead className="w-[15%]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                        </span>
                                        Çek No
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
                            ) : paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Gösterilecek işlem bulunamadı
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {paginatedTransactions.map((transaction) => (
                                        <TableRow
                                            key={transaction.id}
                                            className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                        >
                                            <TableCell>
                                                <div className="font-medium">{formatDate(transaction.Date,"dd/MM/yyyy HH:mm")}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{transaction.CustomerName}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={cn(
                                                    "font-medium",
                                                    parseFloat(transaction.credit) < 0 
                                                        ? "text-red-600 dark:text-red-400" 
                                                        : "text-green-600 dark:text-green-400"
                                                )}>
                                                    {transaction.Credit ?? 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="font-medium text-red-600 dark:text-red-400">
                                                    {transaction.Debit ?? 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={cn(
                                                    "font-medium",
                                                    parseFloat(transaction.balance) < 0 
                                                        ? "text-red-600 dark:text-red-400" 
                                                        : "text-green-600 dark:text-green-400"
                                                )}>
                                                    {transaction.Balance ?? 0}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{transaction.CheckNo ?? 0}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    
                                    <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                                        <TableCell colSpan={2} className="text-right">
                                            <div className="font-bold">TOPLAM:</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "font-bold",
                                                totals.credit < 0 
                                                    ? "text-red-600 dark:text-red-400" 
                                                    : "text-green-600 dark:text-green-400"
                                            )}>
                                                {formatNumber(totals.credit)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-bold text-red-600 dark:text-red-400">
                                                {formatNumber(totals.debit)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "font-bold",
                                                totals.balance < 0 
                                                    ? "text-red-600 dark:text-red-400" 
                                                    : "text-green-600 dark:text-green-400"
                                            )}>
                                                {formatNumber(totals.balance)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* Boş hücre */}
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Card>
    )
}
