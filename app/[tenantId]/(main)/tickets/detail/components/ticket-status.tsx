"use client"

import { AlertCircle, Loader2 } from "lucide-react"

interface TicketStatusProps {
    isLoading: boolean;
    error: string | null;
}

export function TicketStatus({ isLoading, error }: TicketStatusProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500">Bilet bilgileri yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                    <p className="text-red-500 mb-2">Hata oluştu</p>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        )
    }

    return null
}
