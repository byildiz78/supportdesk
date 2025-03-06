"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, MessageSquare, CheckCircle, Clock, AlertCircle, Phone, Mail, Globe, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ticket } from "@/types/tickets"
import { useTabStore } from "@/stores/tab-store"

interface TicketListProps {
    tickets: Ticket[]
    isLoading: boolean
}

const statusConfig = {
    open: { label: "Açık", class: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    in_progress: { label: "İşlemde", class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    pending: { label: "Beklemede", class: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    resolved: { label: "Çözüldü", class: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" },
    closed: { label: "Kapalı", class: "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800" }
}

const priorityConfig = {
    low: { label: "Düşük", class: "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800" },
    medium: { label: "Orta", class: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    high: { label: "Yüksek", class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    urgent: { label: "Acil", class: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800" }
}

const sourceIcons = {
    email: Mail,
    phone: Phone,
    web: Globe,
    chat: MessageCircle
}

export function TicketList({ tickets, isLoading }: TicketListProps) {
    const { addTab, setActiveTab } = useTabStore()

    const handleViewTicket = (ticket: Ticket) => {
        const tabId = `ticket-${ticket.id}`
        addTab({
            id: tabId,
            title: `Talep #${ticket.id}`,
            lazyComponent: () => import('../detail/page').then(module => ({
                default: (props: any) => <module.default {...props} ticketId={ticket.id} />
            }))
        })
        setActiveTab(tabId)
    }

    return (
        <div className="flex-1 overflow-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-transparent
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
            <Table>
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <TableRow>
                        <TableHead className="w-[10%]">Talep No</TableHead>
                        <TableHead className="w-[25%]">Başlık</TableHead>
                        <TableHead className="w-[15%]">Müşteri</TableHead>
                        <TableHead className="w-[10%]">Kaynak</TableHead>
                        <TableHead className="w-[10%]">Öncelik</TableHead>
                        <TableHead className="w-[10%]">Durum</TableHead>
                        <TableHead className="w-[15%]">Atanan</TableHead>
                        <TableHead className="w-[5%]">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-[400px]">
                                <CustomLoader
                                    message="Yükleniyor"
                                    description="Destek talepleri hazırlanıyor..."
                                />
                            </TableCell>
                        </TableRow>
                    ) : tickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                    <h3 className="font-semibold text-lg">Destek Talebi Bulunamadı</h3>
                                    <p className="text-muted-foreground">Henüz hiç destek talebi oluşturulmamış.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        tickets.map((ticket) => (
                            <TableRow key={ticket.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell className="font-medium">#{ticket.id}</TableCell>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell>{ticket.customerName}</TableCell>
                                <TableCell>
                                    {ticket.source && (
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const Icon = sourceIcons[ticket.source as keyof typeof sourceIcons]
                                                return Icon && <Icon className={cn(
                                                    "h-4 w-4",
                                                    ticket.source === 'email' && "text-blue-600 dark:text-blue-400",
                                                    ticket.source === 'phone' && "text-green-600 dark:text-green-400",
                                                    ticket.source === 'web' && "text-purple-600 dark:text-purple-400",
                                                    ticket.source === 'chat' && "text-amber-600 dark:text-amber-400"
                                                )} />
                                            })()}
                                            <span className="capitalize">{ticket.source}</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(priorityConfig[ticket.priority].class)}>
                                        {priorityConfig[ticket.priority].label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(statusConfig[ticket.status].class)}>
                                        {statusConfig[ticket.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell>{ticket.assignedToName || "-"}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                                <Eye className="h-4 w-4 mr-2" /> Görüntüle
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}