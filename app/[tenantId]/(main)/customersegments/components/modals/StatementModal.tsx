"use client"

import { useState } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Calendar, FileText, Printer, Search } from 'lucide-react'
import { mockStatementData } from "../../data/mock-data"

interface StatementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: any | null;
    startDate?: string;
    endDate?: string;
    setStartDate?: (value: string) => void;
    setEndDate?: (value: string) => void;
}

export function StatementModal({
    open,
    onOpenChange,
    customer,
    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    setStartDate,
    setEndDate
}: StatementModalProps) {
    // Local state için
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);
    const [filteredData, setFilteredData] = useState(mockStatementData);
    
    // Props'dan gelen setStartDate ve setEndDate fonksiyonları yoksa local state kullan
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (setStartDate) {
            setStartDate(value);
        }
        setLocalStartDate(value);
    };
    
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (setEndDate) {
            setEndDate(value);
        }
        setLocalEndDate(value);
    };
    
    // Filtreleme işlemi
    const applyFilter = () => {
        const filtered = mockStatementData.filter(item => {
            // "DD.MM.YYYY" formatını "YYYY-MM-DD" formatına çevirelim
            const parts = item.date.split('.');
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            
            return formattedDate >= localStartDate && formattedDate <= localEndDate;
        });
        
        setFilteredData(filtered);
    };
    
    // Balance calculation
    const totalBalance = filteredData.reduce((acc, item) => {
        if (item.type === 'debt') {
            return acc - item.amount;
        } else {
            return acc + item.amount;
        }
    }, 0);
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="bg-gradient-to-r from-purple-500/10 to-purple-700/10 p-6 rounded-t-lg">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            Müşteri Ekstresi
                        </span>
                    </DialogTitle>
                    
                    {customer && (
                        <Card className="border-0 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/10 dark:to-fuchsia-900/10 shadow-md mt-2">
                            <CardContent className="p-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Müşteri</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {customer.name}
                                    </span>
                                    <div className="flex justify-between mt-2">
                                        <div>
                                            <span className="text-xs text-muted-foreground">Kart No</span>
                                            <div className="font-medium text-gray-800 dark:text-gray-200">{customer.cardNo}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Güncel Bakiye</span>
                                            <div className={cn(
                                                "font-medium",
                                                customer.balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                            )}>
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(customer.balance)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <Label htmlFor="statement-start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Başlangıç Tarihi
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="statement-start-date"
                                    type="date"
                                    value={localStartDate}
                                    onChange={handleStartDateChange}
                                    className="border-2 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            </div>
                        </div>
                        
                        <div className="col-span-1">
                            <Label htmlFor="statement-end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Bitiş Tarihi
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="statement-end-date"
                                    type="date"
                                    value={localEndDate}
                                    onChange={handleEndDateChange}
                                    className="border-2 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 transition-all"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            </div>
                        </div>
                        
                        <div className="col-span-1 flex items-end">
                            <Button 
                                onClick={applyFilter}
                                className={cn(
                                    "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700",
                                    "text-white shadow-md shadow-purple-500/20 dark:shadow-purple-900/30",
                                    "transition-all duration-200 hover:scale-[1.02] w-full"
                                )}
                            >
                                <Search className="h-4 w-4 mr-2" /> Uygula
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-4 max-h-[450px] overflow-auto
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-transparent
                    dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                    hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                    dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                                <TableHead>Tarih</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                        Seçilen tarih aralığında işlem bulunamadı
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item, index) => (
                                    <TableRow key={index} className="group hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                                        <TableCell className="font-medium">{item.date}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-medium",
                                            item.type === "debt" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                        )}>
                                            {item.type === "debt" ? "-" : "+"}{formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-t border-purple-100 dark:border-purple-800">
                    <div className="flex justify-between items-center">
                        <div className="text-sm">
                            <span className="text-muted-foreground mr-2">Seçilen Dönem Bakiyesi:</span>
                            <span className={cn(
                                "font-medium",
                                totalBalance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}>
                                {formatCurrency(totalBalance)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Kapat
                            </Button>
                            <Button 
                                className={cn(
                                    "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700",
                                    "text-white shadow-md shadow-purple-500/20 dark:shadow-purple-900/30",
                                    "transition-all duration-200 hover:scale-[1.02]"
                                )}
                            >
                                <Printer className="h-4 w-4 mr-2" /> Yazdır
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
