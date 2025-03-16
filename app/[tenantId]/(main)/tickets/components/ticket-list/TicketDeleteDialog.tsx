"use client"

import * as React from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Ticket } from "@/types/tickets"

interface TicketDeleteDialogProps {
    ticket: Ticket | null
    open: boolean
    isDeleting: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export function TicketDeleteDialog({ ticket, open, isDeleting, onOpenChange, onConfirm }: TicketDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Destek Talebi Silme İşlemi</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className="font-semibold">#{ticket?.ticketno}</span> numaralı destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm} 
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
