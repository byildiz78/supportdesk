"use client"

import { MessageSquare } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"

export function TicketEmptyState() {
    return (
        <TableRow>
            <TableCell colSpan={12} className="h-[400px] text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                    <h3 className="font-semibold text-lg">Destek Talebi Bulunamadı</h3>
                    <p className="text-muted-foreground">Görüntülenecek destek talebi bulunmamaktadır.</p>
                </div>
            </TableCell>
        </TableRow>
    )
}
