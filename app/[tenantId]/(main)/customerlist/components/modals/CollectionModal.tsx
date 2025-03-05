"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    CardContent
} from "@/components/ui/card"
import { Calendar, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: any | null;
    transactionAmount: string;
    setTransactionAmount: (value: string) => void;
    transactionDescription: string;
    setTransactionDescription: (value: string) => void;
    transactionDate: string;
    setTransactionDate: (value: string) => void;
    onSubmit: () => void;
}

export function CollectionModal({
    open,
    onOpenChange,
    customer,
    transactionAmount,
    setTransactionAmount,
    transactionDescription,
    setTransactionDescription,
    transactionDate,
    setTransactionDate,
    onSubmit
}: CollectionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Tahsilat Girişi
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        {customer && (
                            <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 shadow-md mt-2">
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
                                                <span className="text-xs text-muted-foreground">Bakiye</span>
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
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collection-amount" className="text-right col-span-1 font-medium text-gray-700 dark:text-gray-300">
                            Tutar
                        </Label>
                        <div className="col-span-3 relative">
                            <Input
                                id="collection-amount"
                                type="number"
                                value={transactionAmount}
                                onChange={(e) => setTransactionAmount(e.target.value)}
                                className="pl-8 border-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 transition-all"
                                placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collection-date" className="text-right col-span-1 font-medium text-gray-700 dark:text-gray-300">
                            Tarih
                        </Label>
                        <div className="col-span-3 relative">
                            <Input
                                id="collection-date"
                                type="date"
                                value={transactionDate}
                                onChange={(e) => setTransactionDate(e.target.value)}
                                className="border-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 transition-all"
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="collection-description" className="text-right col-span-1 font-medium text-gray-700 dark:text-gray-300 pt-2">
                            Açıklama
                        </Label>
                        <Textarea
                            id="collection-description"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            className="col-span-3 border-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 transition-all min-h-[100px]"
                            placeholder="Tahsilat açıklaması giriniz"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        İptal
                    </Button>
                    <Button 
                        onClick={onSubmit}
                        className={cn(
                            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                            "text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30",
                            "transition-all duration-200 hover:scale-[1.02]"
                        )}
                        disabled={!transactionAmount}
                    >
                        Tahsilat Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
