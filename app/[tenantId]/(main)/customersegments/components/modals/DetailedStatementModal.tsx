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
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, Printer, Search } from 'lucide-react'
import { mockDetailedStatementData } from "../../data/mock-data"

interface DetailedStatementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: any | null;
    startDate?: string;
    endDate?: string;
    setStartDate?: (value: string) => void;
    setEndDate?: (value: string) => void;
}

interface DetailedStatementItem {
    date: string;
    documentNo: string;
    description: string;
    amount: number;
    type: string;
    userCode: string;
    hasItems?: boolean;
    items?: {
        name: string;
        price: number;
        quantity: number;
        total: number;
        discount: number;
        netTotal: number;
    }[];
    paymentType?: string;
    totalAmount?: number;
}

export function DetailedStatementModal({
    open,
    onOpenChange,
    customer,
    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    setStartDate,
    setEndDate
}: DetailedStatementModalProps) {
    // Local state için
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);
    const [filteredData, setFilteredData] = useState<DetailedStatementItem[]>(mockDetailedStatementData);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    
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
        const filtered = mockDetailedStatementData.filter(item => {
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

    // Satır genişletme/daraltma işlemi
    const toggleRowExpand = (documentNo: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [documentNo]: !prev[documentNo]
        }));
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1100px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="bg-gradient-to-r from-amber-500/10 to-amber-700/10 p-6 rounded-t-lg">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <FileSpreadsheet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                            Detaylı Müşteri Ekstresi
                        </span>
                    </DialogTitle>
                    
                    {customer && (
                        <Card className="border-0 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 shadow-md mt-2">
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
                            <Label htmlFor="detailed-statement-start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Başlangıç Tarihi
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="detailed-statement-start-date"
                                    type="date"
                                    value={localStartDate}
                                    onChange={handleStartDateChange}
                                    className="border-2 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20 transition-all"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            </div>
                        </div>
                        
                        <div className="col-span-1">
                            <Label htmlFor="detailed-statement-end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Bitiş Tarihi
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="detailed-statement-end-date"
                                    type="date"
                                    value={localEndDate}
                                    onChange={handleEndDateChange}
                                    className="border-2 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20 transition-all"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            </div>
                        </div>
                        
                        <div className="col-span-1 flex items-end">
                            <Button 
                                onClick={applyFilter}
                                className={cn(
                                    "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700",
                                    "text-white shadow-md shadow-amber-500/20 dark:shadow-amber-900/30",
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
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Belge No</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                                <TableHead>İşlemi Yapan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Seçilen tarih aralığında işlem bulunamadı
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item, index) => (
                                    <>
                                        <TableRow 
                                            key={`${item.documentNo}-${index}`} 
                                            className={cn(
                                                "group hover:bg-amber-50/50 dark:hover:bg-amber-900/20 cursor-pointer",
                                                expandedRows[item.documentNo] && "bg-amber-50/70 dark:bg-amber-900/30"
                                            )}
                                            onClick={() => item.hasItems && toggleRowExpand(item.documentNo)}
                                        >
                                            <TableCell className="py-2">
                                                {item.hasItems && (
                                                    <div className="flex items-center justify-center">
                                                        {expandedRows[item.documentNo] 
                                                            ? <ChevronDown className="h-4 w-4 text-amber-600" /> 
                                                            : <ChevronRight className="h-4 w-4 text-amber-600" />
                                                        }
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.date}</TableCell>
                                            <TableCell>{item.documentNo}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className={cn(
                                                "text-right font-medium",
                                                item.type === "debt" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                            )}>
                                                {item.type === "debt" ? "-" : "+"}{formatCurrency(item.amount)}
                                            </TableCell>
                                            <TableCell>{item.userCode}</TableCell>
                                        </TableRow>
                                        
                                        {/* Ürün Detayları */}
                                        {item.hasItems && expandedRows[item.documentNo] && (
                                            <TableRow 
                                                key={`${item.documentNo}-details-${index}`}
                                                className="bg-amber-50/30 dark:bg-amber-900/10"
                                            >
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="p-4 border-l-2 border-amber-400 ml-4 my-2">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                                                Satış Detayları
                                                            </h4>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                Ödeme Tipi: {item.paymentType}
                                                            </span>
                                                        </div>
                                                        
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="hover:bg-transparent border-b border-amber-200 dark:border-amber-800/30">
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400">Ürün Adı</TableHead>
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400 text-right">Fiyat</TableHead>
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400 text-center">Miktar</TableHead>
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400 text-right">Tutar</TableHead>
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400 text-right">İndirim</TableHead>
                                                                    <TableHead className="text-xs font-medium text-amber-700 dark:text-amber-400 text-right">Net Tutar</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {item.items?.map((product, productIndex) => (
                                                                    <TableRow 
                                                                        key={`${item.documentNo}-product-${productIndex}`}
                                                                        className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 border-b border-amber-100/50 dark:border-amber-800/10"
                                                                    >
                                                                        <TableCell className="py-1 text-sm">{product.name}</TableCell>
                                                                        <TableCell className="py-1 text-sm text-right">{formatCurrency(product.price)}</TableCell>
                                                                        <TableCell className="py-1 text-sm text-center">{product.quantity}</TableCell>
                                                                        <TableCell className="py-1 text-sm text-right">{formatCurrency(product.total)}</TableCell>
                                                                        <TableCell className="py-1 text-sm text-right">{formatCurrency(product.discount)}</TableCell>
                                                                        <TableCell className="py-1 text-sm text-right font-medium">{formatCurrency(product.netTotal)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        
                                                        <div className="flex justify-end mt-2">
                                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Toplam: {formatCurrency(item.totalAmount || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 border-t border-amber-100 dark:border-amber-800">
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
                                    "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700",
                                    "text-white shadow-md shadow-amber-500/20 dark:shadow-amber-900/30",
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
