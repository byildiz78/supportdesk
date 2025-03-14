"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, MessageSquare, CheckCircle, Clock, AlertCircle, Phone, Mail, Globe, MessageCircle, Building, Building2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ticket } from "@/types/tickets"
import { useTabStore } from "@/stores/tab-store"
import { format, isAfter } from "date-fns"

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
                        <TableHead className="w-[8%]">Talep No</TableHead>
                        <TableHead className="w-[20%]">Başlık</TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>Ana Firma</span>
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>Firma</span>
                            </div>
                        </TableHead>
                        <TableHead className="w-[12%]">
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>İletişim</span>
                            </div>
                        </TableHead>
                        <TableHead className="w-[8%]">Öncelik</TableHead>
                        <TableHead className="w-[8%]">Durum</TableHead>
                        <TableHead className="w-[10%]">Atanan</TableHead>
                        <TableHead className="w-[4%]">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-[400px]">
                                <CustomLoader
                                    message="Yükleniyor"
                                    description="Destek talepleri hazırlanıyor..."
                                />
                            </TableCell>
                        </TableRow>
                    ) : tickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                    <h3 className="font-semibold text-lg">Destek Talebi Bulunamadı</h3>
                                    <p className="text-muted-foreground">Henüz hiç destek talebi oluşturulmamış.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        tickets.map((ticket) => (
                            <TableRow 
                                key={ticket.id} 
                                className={cn(
                                    "group hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                    ticket.slaBreach && "bg-red-50/50 dark:bg-red-900/10"
                                )}
                            >
                                <TableCell className="font-medium">#{ticket.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{ticket.title}</span>
                                        {ticket.dueDate && (
                                            <span className={cn(
                                                "text-xs mt-1",
                                                ticket.slaBreach 
                                                    ? "text-red-600 dark:text-red-400" 
                                                    : "text-muted-foreground"
                                            )}>
                                                <Clock className="inline-block h-3 w-3 mr-1" />
                                                {format(new Date(ticket.dueDate), "dd.MM.yyyy HH:mm")}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                        <span className="truncate" title={ticket.parentCompanyName || ""}>
                                            {ticket.parentCompanyName || "-"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <span className="truncate" title={ticket.companyName || ""}>
                                            {ticket.companyName || "-"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="truncate font-medium" title={ticket.contactName || ""}>
                                            {ticket.contactName || "-"}
                                        </span>
                                        {ticket.contactPosition && (
                                            <span className="text-xs text-muted-foreground truncate" title={ticket.contactPosition}>
                                                {ticket.contactPosition}
                                            </span>
                                        )}
                                    </div>
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