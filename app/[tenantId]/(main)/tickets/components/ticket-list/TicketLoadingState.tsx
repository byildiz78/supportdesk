"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { CustomLoader } from "@/components/ui/custom-loader"

export function TicketLoadingState() {
    return (
        <TableRow>
            <TableCell colSpan={12} className="h-[400px]">
                <CustomLoader
                    message="Yükleniyor"
                    description="Destek talepleri hazırlanıyor..."
                />
            </TableCell>
        </TableRow>
    )
}
