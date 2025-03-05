"use client"

import { useState, useEffect } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon, FileText, Printer, Search } from 'lucide-react'
import { CustomLoader } from "@/components/ui/custom-loader"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import axios from "@/lib/axios"

// Define the statement data types
interface CustomerInfo {
    customerName: string;
    cardNo: string;
    balance: number;
}

interface Transaction {
    date: string;
    description: string;
    amount: string;
    type: string;
    checkNo?: string;
}

interface StatementData {
    customer: string;
    transactions: Transaction[];
    periodBalance: string;
}

interface StatementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: any | null;
    startDate?: string;
    endDate?: string;
    setStartDate?: (value: string) => void;
    setEndDate?: (value: string) => void;
}

// Bir önceki ayın 1'ini alacak yardımcı fonksiyon
const getPreviousMonthFirstDay = () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return previousMonth;
};

// ISO formatında string tarihi Date objesine çevirme
const parseISODate = (isoDateString) => {
    if (!isoDateString) return new Date();
    return new Date(isoDateString);
};

// Date objesini ISO string formatına çevirme (yalnızca tarih kısmı)
const dateToISOString = (date) => {
    return date.toISOString().split('T')[0];
};

export function StatementModal({
    open,
    onOpenChange,
    customer,
    startDate,
    endDate,
    setStartDate,
    setEndDate
}: StatementModalProps) {
    // Varsayılan başlangıç tarihi bir önceki ayın 1'i
    const defaultStartDate = startDate || dateToISOString(getPreviousMonthFirstDay());
    // Varsayılan bitiş tarihi bugün
    const defaultEndDate = endDate || dateToISOString(new Date());

    // Local state
    const [localStartDate, setLocalStartDate] = useState(defaultStartDate);
    const [localEndDate, setLocalEndDate] = useState(defaultEndDate);
    const [statementData, setStatementData] = useState<StatementData | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [periodBalance, setPeriodBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    // Date picker popover açık/kapalı state'leri
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    
    // Date nesneleri için state
    const [startDateObj, setStartDateObj] = useState<Date | undefined>(parseISODate(localStartDate));
    const [endDateObj, setEndDateObj] = useState<Date | undefined>(parseISODate(localEndDate));
    
    // Modal kapatıldığında state temizleme
    useEffect(() => {
        if (!open) {
            // Modal kapatıldığında state'leri temizle
            setStatementData(null);
            setCustomerInfo(null);
            setTransactions([]);
            setPeriodBalance('0');
            setError(null);
            
            // Tarihleri varsayılan değerlere sıfırla
            resetDates();
        } else if (open && customer) {
            // Modal açıldığında verileri getir
            fetchStatementData();
        }
    }, [open, customer]);
    
    // Tarihleri varsayılan değerlere sıfırlama fonksiyonu
    const resetDates = () => {
        const prevMonthFirstDay = getPreviousMonthFirstDay();
        const today = new Date();
        
        // Local state'leri güncelle
        setLocalStartDate(dateToISOString(prevMonthFirstDay));
        setLocalEndDate(dateToISOString(today));
        setStartDateObj(prevMonthFirstDay);
        setEndDateObj(today);
        
        // Props olarak gelen set fonksiyonları varsa onları da güncelle
        if (setStartDate) setStartDate(dateToISOString(prevMonthFirstDay));
        if (setEndDate) setEndDate(dateToISOString(today));
    };
    
    // Başlangıç tarihi değiştiğinde
    const handleStartDateChange = (date: Date | undefined) => {
        if (!date) return;
        
        setStartDateObj(date);
        const isoDate = dateToISOString(date);
        setLocalStartDate(isoDate);
        
        // Prop olarak gelen set fonksiyonu varsa onu da güncelle
        if (setStartDate) setStartDate(isoDate);
    };
    
    // Bitiş tarihi değiştiğinde
    const handleEndDateChange = (date: Date | undefined) => {
        if (!date) return;
        
        setEndDateObj(date);
        const isoDate = dateToISOString(date);
        setLocalEndDate(isoDate);
        
        // Prop olarak gelen set fonksiyonu varsa onu da güncelle
        if (setEndDate) setEndDate(isoDate);
    };
    
    // Fetch statement data
    const fetchStatementData = async () => {
        if (!customer || !customer.CustomerKey) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.post('/api/main/customers/customer-statement/statement', {
                date1: localStartDate,
                date2: localEndDate,
                customerKey: customer.CustomerKey
            });
            
            // Handle the special JSON structure from the API
            const jsonKey = Object.keys(response.data[0])[0]; // Get the first key (JSON_F52E2B61...)
            const jsonString = response.data[0][jsonKey];
            const data = JSON.parse(jsonString);
            
            // Parse the customer JSON string if it's a string
            let customerData;
            if (typeof data.customer === 'string') {
                customerData = JSON.parse(data.customer);
            } else {
                customerData = data.customer;
            }
            
            setCustomerInfo(customerData);
            
            // Ensure transactions exist and are an array (if null or not an array, use empty array)
            let transactionData = [];
            if (data.transactions) {
                // API'den dönen transactions bir string ise parse et
                if (typeof data.transactions === 'string') {
                    try {
                        transactionData = JSON.parse(data.transactions);
                    } catch (e) {
                        transactionData = []; // Parse hatası olursa boş array kullan
                    }
                } else if (Array.isArray(data.transactions)) {
                    transactionData = [...data.transactions];
                }
            }
            
            // Ensure transactions are in the right order (AÇILIŞ BAKİYESİ should be first)
            let sortedTransactions = [...transactionData];
            
            // Find and move AÇILIŞ BAKİYESİ to the top
            const startupIndex = sortedTransactions.findIndex(t => t.description === 'AÇILIŞ BAKİYESİ');
            if (startupIndex > 0) {
                const startupItem = sortedTransactions.splice(startupIndex, 1)[0];
                sortedTransactions.unshift(startupItem);
            }
            
            setTransactions(sortedTransactions);
            setPeriodBalance(data.periodBalance || '0');
            setStatementData(data);
        } catch (err) {
            console.error('Error fetching statement data:', err);
            setError(err.response?.data?.error || 'Ekstre verileri alınırken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Apply filter when button is clicked
    const applyFilter = () => {
        fetchStatementData();
    };
    
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
                    
                    {customerInfo && (
                        <Card className="border-0 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/10 dark:to-fuchsia-900/10 shadow-md mt-2">
                            <CardContent className="p-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Müşteri</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {customerInfo.customerName}
                                    </span>
                                    <div className="flex justify-between mt-2">
                                        <div>
                                            <span className="text-xs text-muted-foreground">Kart No</span>
                                            <div className="font-medium text-gray-800 dark:text-gray-200">{customerInfo.cardNo}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Güncel Bakiye</span>
                                            <div className={cn(
                                                "font-medium",
                                                customerInfo.balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                            )}>
                                                {formatCurrency(customerInfo.balance)}
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
                                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-2",
                                                "focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20",
                                                !startDateObj && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            {startDateObj ? format(startDateObj, "dd.MM.yyyy") : "Tarih seçin"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDateObj}
                                            onSelect={(date) => {
                                                handleStartDateChange(date);
                                                setStartDateOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        
                        <div className="col-span-1">
                            <Label htmlFor="statement-end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Bitiş Tarihi
                            </Label>
                            <div className="mt-1 relative">
                                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-2",
                                                "focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20",
                                                !endDateObj && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            {endDateObj ? format(endDateObj, "dd.MM.yyyy") : "Tarih seçin"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDateObj}
                                            onSelect={(date) => {
                                                handleEndDateChange(date);
                                                setEndDateOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
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
                                disabled={isLoading}
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
                    
                    {isLoading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <CustomLoader 
                                message="Yükleniyor" 
                                description="Ekstre verileri hazırlanıyor..." 
                            />
                        </div>
                    ) : error ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-red-500 font-medium mb-2">Hata</div>
                                <div className="text-gray-500">{error}</div>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Çek No</TableHead>
                                    <TableHead className="text-right">Tutar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            Seçilen tarih aralığında işlem bulunamadı
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((item, index) => (
                                        <TableRow key={index} className="group hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                                            <TableCell className="font-medium">{item.date}</TableCell>
                                            <TableCell>
                                                {item.type === "startupcredit" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        AÇILIŞ BAKİYESİ
                                                    </span>
                                                ) : item.type === "debt" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                        SATIŞ
                                                    </span>
                                                ) : item.type === "credit" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        TAHSİLAT
                                                    </span>
                                                ) : (
                                                    item.description
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.checkNo && item.checkNo.trim() !== "" ? item.checkNo : ""}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-medium",
                                                item.type === "debt" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                            )}>
                                                {item.type === "debt" ? "-" : "+"}{formatCurrency(parseFloat(item.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-t border-purple-100 dark:border-purple-800">
                    <div className="flex justify-between items-center">
                        <div className="text-sm">
                            <span className="text-muted-foreground mr-2">Seçilen Dönem Bakiyesi:</span>
                            <span className={cn(
                                "font-medium",
                                parseFloat(periodBalance) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                            )}>
                                {formatCurrency(parseFloat(periodBalance))}
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