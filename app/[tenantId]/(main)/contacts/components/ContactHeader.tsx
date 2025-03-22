"use client"

import { Button } from "@/components/ui/button"
import { Plus, UserRound, Download } from "lucide-react"

interface ContactHeaderProps {
    onNewContact: () => void;
    onExportToExcel: () => void;
}

export function ContactHeader({ onNewContact, onExportToExcel }: ContactHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <UserRound className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h1 className="text-2xl font-bold tracking-tight">Kişiler</h1>
                </div>
                <p className="text-muted-foreground">
                    Kişi kayıtlarını görüntüleyin ve yönetin
                </p>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline"
                    onClick={onExportToExcel}
                >
                    <Download className="mr-2 h-4 w-4" /> Excel'e Aktar
                </Button>
                <Button 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                    onClick={onNewContact}
                >
                    <Plus className="mr-2 h-4 w-4" /> Yeni Kişi
                </Button>
            </div>
        </div>
    )
}
