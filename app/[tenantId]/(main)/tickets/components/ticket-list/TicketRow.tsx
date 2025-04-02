"use client"

import * as React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
    Building, 
    Clock, 
    CalendarClock, 
    User,
    Eye, 
    Edit, 
    Trash, 
    MoreHorizontal,
    Phone
} from "lucide-react"
import { Ticket } from "@/types/tickets"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { statusConfig, priorityConfig, sourceConfig, calculateElapsedTime, calculateSlaTime } from "../config/ticket-config"
import { getUserRole } from "@/utils/user-utils"

// Define types for status and priority
type TicketStatus = keyof typeof statusConfig
type TicketPriority = keyof typeof priorityConfig

interface TicketRowProps {
    ticket: Ticket
    onView: (ticket: Ticket) => void
    onEdit: (ticket: Ticket) => void
    onDelete: (ticket: Ticket) => void
    showStatusColumn?: boolean,
    userRole?: string
}

export function TicketRow({ ticket, onView, onEdit, onDelete, showStatusColumn = true, userRole }: TicketRowProps) {
    const isUnassigned = !ticket.assignedUserName;
 
    return (
        <TableRow 
            className={cn(
                "group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-200",
                ticket.slaBreach && "bg-red-50/50 dark:bg-red-900/10",
                isUnassigned && "bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-900/15 dark:via-amber-900/8 dark:to-transparent border-l-[3px] border-amber-400 dark:border-amber-500"
            )}
        >
            <TableCell className="font-medium">
                <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    onClick={() => onView(ticket)}
                >
                    #{ticket.ticketno}
                </Button>
            </TableCell>
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
                <div className="flex flex-col">
                    <span className="truncate">{ticket.description ? ticket.description.substring(0, 50) + (ticket.description.length > 50 ? '...' : '') : "-"}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="truncate">
                        {ticket.companyName || "-"}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="truncate font-medium">
                        {ticket.customerName || ticket.customer_name || "-"}
                    </span>
                    {(ticket.contactPosition || ticket.contact_position) && (
                        <span className="text-xs text-muted-foreground truncate">
                            {ticket.contactPosition || ticket.contact_position}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="truncate font-medium">
                        {ticket.callcount || 0}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    {ticket.source && sourceConfig[ticket.source as keyof typeof sourceConfig] && (
                        <div className="flex items-center gap-1">
                            {React.createElement(sourceConfig[ticket.source as keyof typeof sourceConfig].icon, {
                                className: "h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                            })}
                            <span className="truncate">{sourceConfig[ticket.source as keyof typeof sourceConfig].label}</span>
                        </div>
                    )}
                    {!ticket.source && <span className="text-gray-400">-</span>}
                </div>
            </TableCell>
            <TableCell>
                <Badge className={cn(
                    "text-xs font-medium",
                    priorityConfig[ticket.priority as TicketPriority]?.class || ""
                )}>
                    {priorityConfig[ticket.priority as TicketPriority]?.label || "Bilinmiyor"}
                </Badge>
            </TableCell>
            {showStatusColumn && (
            <TableCell>
                <Badge variant="outline" className={cn(
                    "text-xs font-medium",
                    statusConfig[ticket.status as TicketStatus]?.class || ""
                )}>
                    {statusConfig[ticket.status as TicketStatus]?.label || "Bilinmiyor"}
                </Badge>
            </TableCell>
            )}
            <TableCell>
                {ticket.assignedUserName ? (
                    <div className="flex items-center gap-1.5">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        </div>
                        <span className="truncate font-medium text-gray-700 dark:text-gray-300">{ticket.assignedUserName}</span>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <Badge variant="outline" className="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800/80 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-sm flex items-center gap-1.5">
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-0.5 rounded-full">
                                <User className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                            </div>
                            <span>-</span>
                        </Badge>
                    </div>
                )}
            </TableCell>
            <TableCell>
                <span className="text-xs">{ticket.createdAt ? format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm") : "-"}</span>
            </TableCell>
            <TableCell>
                <span className="text-xs">{ticket.createdAt ? calculateElapsedTime(ticket.createdAt) : "-"}</span>
            </TableCell>
            <TableCell>
                {ticket.dueDate && (
                    <div className="flex items-center gap-1">
                        <CalendarClock className={cn(
                            "h-4 w-4",
                            ticket.slaBreach 
                                ? "text-red-600 dark:text-red-400" 
                                : "text-green-600 dark:text-green-400"
                        )} />
                        <span className={cn(
                            "text-xs",
                            ticket.slaBreach 
                                ? "text-red-600 dark:text-red-400" 
                                : "text-green-600 dark:text-green-400"
                        )}>
                            {calculateSlaTime(ticket.dueDate, !!ticket.slaBreach)}
                        </span>
                    </div>
                )}
                {!ticket.dueDate && <span className="text-gray-400 text-xs">-</span>}
            </TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Görüntüle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(ticket)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Düzenle</span>
                        </DropdownMenuItem>
                        {(userRole == 'admin' || userRole == 'manager') && (
                            <DropdownMenuItem onClick={() => onDelete(ticket)} className="text-red-600 dark:text-red-400">
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Sil</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}
