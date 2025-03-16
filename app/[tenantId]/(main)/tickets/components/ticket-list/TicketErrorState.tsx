"use client"

import { AlertCircle } from "lucide-react"

interface TicketErrorStateProps {
    error: string
}

export function TicketErrorState({ error }: TicketErrorStateProps) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hata Oluştu</h3>
                <p className="text-muted-foreground">{error}</p>
            </div>
        </div>
    )
}
