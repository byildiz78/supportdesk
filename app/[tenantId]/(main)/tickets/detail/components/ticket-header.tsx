"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, KeyRound, AlertCircle, ChevronDown, Info, MessageSquare, Clock, UserCheck, Calendar, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Hash } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"
import { getStatusChange } from "@/lib/utils"
import { EditableTicketDetails } from "./editable-ticket-details"

interface TicketHeaderProps {
    id: string;
    title: string;
    createdBy: string | null;
    createdByName: string | null;
    status: string;
    assignedTo: string | null;
    selectedCompany: any;
    isLicenseExpired: boolean;
    createdAt: string;
    resolved_by?: string | null;
    resolution_notes?: string | null;
    description: string;
    customerName: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    companyName?: string | null;
    companyId?: string | null;
    contactPosition?: string | null;
    dueDate?: string | null;
    parentCompanyId?: string | null;
    contactId?: string | null;
    slaBreached?: boolean | null;
    priority?: string;
    source?: string | null;
    categoryId?: string | null;
    subcategoryId?: string | null;
    groupId?: string | null;
    ticket_created_by_name: string | null;
    assigned_user_name: string | null;
    due_date: string | null;
    onUpdate: (updatedTicket: any) => void;
}

export function TicketHeader({
    id,
    title,
    createdBy,
    createdByName,
    status,
    assignedTo,
    selectedCompany,
    isLicenseExpired,
    createdAt,
    resolved_by,
    resolution_notes,
    description,
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    companyId,
    contactPosition,
    dueDate,
    parentCompanyId,
    contactId,
    slaBreached,
    priority,
    source,
    categoryId,
    subcategoryId,
    groupId,
    ticket_created_by_name,
    assigned_user_name,
    due_date,
    onUpdate
}: TicketHeaderProps) {
    const [isLicenseNotesOpen, setIsLicenseNotesOpen] = useState(false);
    const [isSupportNotesOpen, setIsSupportNotesOpen] = useState(false);

    // Status color schemes and icons
    const statusColors = {
        new: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            text: 'text-blue-700 dark:text-blue-300',
            border: 'border-blue-100 dark:border-blue-800/50',
            hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/20',
            gradient: 'from-blue-400 to-blue-600',
            iconComponent: HelpCircle
        },
        open: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            text: 'text-emerald-700 dark:text-emerald-300',
            border: 'border-emerald-100 dark:border-emerald-800/50',
            hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-800/20',
            gradient: 'from-emerald-400 to-emerald-600',
            iconComponent: AlertTriangle
        },
        resolved: {
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            text: 'text-purple-700 dark:text-purple-300',
            border: 'border-purple-100 dark:border-purple-800/50',
            hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/20',
            gradient: 'from-purple-400 to-purple-600',
            iconComponent: CheckCircle2
        },
        closed: {
            bg: 'bg-gray-50 dark:bg-gray-800/20',
            text: 'text-gray-700 dark:text-gray-300',
            border: 'border-gray-100 dark:border-gray-700/50',
            hover: 'hover:bg-gray-100 dark:hover:bg-gray-700/30',
            gradient: 'from-gray-400 to-gray-600',
            iconComponent: XCircle
        },
        waiting: {
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            text: 'text-purple-700 dark:text-purple-300',
            border: 'border-purple-100 dark:border-purple-800/50',
            hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/20',
            gradient: 'from-purple-400 to-purple-600',
            iconComponent: Clock
        },
        pending: {
            bg: 'bg-indigo-50 dark:bg-indigo-900/10',
            text: 'text-indigo-700 dark:text-indigo-300',
            border: 'border-indigo-100 dark:border-indigo-800/50',
            hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-800/20',
            gradient: 'from-indigo-400 to-indigo-600',
            iconComponent: AlertTriangle
        },
        default: {
            bg: 'bg-orange-50 dark:bg-orange-900/10',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-100 dark:border-orange-800/50',
            hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/20',
            gradient: 'from-orange-400 to-orange-600',
            iconComponent: AlertCircle
        }
    };

    // Get the current status colors
    const currentStatus = statusColors[status as keyof typeof statusColors] || statusColors.default;
    const StatusIcon = currentStatus.iconComponent;

    // Create ticket object for EditableTicketDetails
    const ticket = {
        id,
        title,
        description: description || '', // Ensure description is not undefined
        customer_name: customerName,
        created_at: createdAt,
        status,
        priority: priority || 'medium',
        source: source || 'web',
        category_id: categoryId,
        subcategory_id: subcategoryId,
        group_id: groupId,
        assigned_to: assignedTo,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        company_name: companyName,
        company_id: companyId,
        contact_position: contactPosition,
        due_date: dueDate,
        parent_company_id: parentCompanyId,
        contact_id: contactId,
        created_by: createdBy,
        sla_breach: slaBreached,
        assigned_user_name: assigned_user_name
    };

    return (
        <div className="mb-4">
            {/* Main Container */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Main Card */}
                <Card className={`overflow-hidden flex-1 shadow-sm transition-all duration-300 hover:shadow-md border ${isLicenseExpired
                    ? 'border-red-300 dark:border-red-700/70 bg-white dark:bg-gray-900/95'
                    : 'border-blue-200/80 dark:border-blue-800/50 bg-white dark:bg-gray-900/95'
                    }`}>
                    <div className="p-4">
                        {/* Compact Info Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800/70">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <User className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                    <span className="font-medium">Oluşturan:</span>
                                    <span>{ticket_created_by_name && ticket_created_by_name !== "Bilinmiyor" ? ticket_created_by_name : "Bilinmiyor"}</span>
                                </div>

                                <div className="h-3 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <Calendar className="h-3 w-3 text-green-500 dark:text-green-400" />
                                    <span className="font-medium">Tarih:</span>
                                    <span>{createdAt ? format(new Date(createdAt), "dd.MM.yyyy HH:mm") : "Belirtilmemiş"}</span>
                                </div>

                                <div className="h-3 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 hidden sm:block"></div>

                                <div className="hidden sm:inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr }) : "Tarih bilgisi yok"}
                                    </span>
                                </div>

                                {/* Ayırıcı çizgi */}
                                <div className="h-3 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 hidden sm:block"></div>

                                {/* SLA Bitiş Tarihi */}
                                {due_date && (
                                    <div className="hidden sm:flex items-center text-[11px] text-gray-600 dark:text-gray-300">
                                        <Clock className="h-3 w-3 mr-1 text-red-500" />
                                        <span className="font-medium">
                                            SLA: {format(new Date(due_date), 'd MMMM yyyy HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <UserCheck className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                                    <span className="text-xs font-medium">Atanan:</span>
                                    {assigned_user_name ? (
                                        <span className="text-xs text-blue-600 dark:text-blue-400">{assigned_user_name}</span>
                                    ) : (
                                        <Badge variant="outline" className="px-1 py-0 text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                            Atanmamış
                                        </Badge>
                                    )}
                                </div>

                                <Badge
                                    className={`px-2 py-0.5 ${currentStatus.bg} ${currentStatus.text} border ${currentStatus.border} flex items-center gap-1 transition-all duration-300 group text-xs`}
                                >
                                    <StatusIcon className="h-3 w-3 transition-transform group-hover:scale-110 duration-300" />
                                    <span className="font-medium">{getStatusChange(status)}</span>
                                </Badge>
                            </div>
                        </div>

                        {/* Ticket Content Area - EditableTicketDetails */}
                        <div>
                            <EditableTicketDetails
                                ticket={ticket}
                                onUpdate={onUpdate}
                            />
                        </div>
                    </div>
                </Card>

                {/* Side Panel - Collapsed on mobile, expandable */}
                <div className="flex flex-col gap-2 md:w-[250px]">
                    {/* License Information Card */}
                    <Card className={`overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md border ${isLicenseExpired
                        ? 'border-red-300 dark:border-red-700/70 bg-white dark:bg-gray-900/95'
                        : 'border-amber-200/80 dark:border-amber-800/50 bg-white dark:bg-gray-900/95'
                        }`}>
                        <div className="p-3">
                            <div className={`flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-800/70 ${isLicenseExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                <div className="flex items-center">
                                    <KeyRound className={`h-3.5 w-3.5 mr-1.5 ${isLicenseExpired ? 'text-red-500' : 'text-gray-500'}`} />
                                    <span className="text-xs font-medium">BA Bilgileri</span>
                                </div>
                                {isLicenseExpired && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                                        Süresi Dolmuş
                                    </Badge>
                                )}
                            </div>

                            {isLicenseExpired ? (
                                <div className="flex items-center py-1.5 px-2.5 bg-red-50/80 dark:bg-red-900/20 rounded-md text-xs border border-red-200/70 dark:border-red-800/50">
                                    <AlertCircle className="h-3 w-3 mr-1.5 text-red-500 flex-shrink-0" />
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        BA bulunmamaktadır
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-md p-2.5 border border-amber-200/60 dark:border-amber-800/30 transition-all duration-200 hover:shadow-sm">
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className="text-gray-500 dark:text-gray-400">Başlangıç:</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 text-right">
                                                {selectedCompany?.flow_ba_starting_date ?
                                                    format(new Date(selectedCompany.flow_ba_starting_date), 'dd.MM.yyyy') :
                                                    'Belirtilmemiş'}
                                            </div>

                                            <div className="text-gray-500 dark:text-gray-400">Bitiş:</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 text-right">
                                                {selectedCompany?.flow_ba_end_date ?
                                                    format(new Date(selectedCompany.flow_ba_end_date), 'dd.MM.yyyy') :
                                                    'Belirtilmemiş'}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedCompany?.flow_licence_notes && (
                                        <div>
                                            <button
                                                onClick={() => setIsLicenseNotesOpen(!isLicenseNotesOpen)}
                                                className="w-full text-left flex items-center justify-between text-gray-700 dark:text-gray-300 text-xs font-medium py-1.5 px-2.5 rounded-md hover:bg-gray-50/80 dark:hover:bg-gray-800/60 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 focus:ring-opacity-50 group"
                                            >
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                                                    Lisans Notları
                                                </span>
                                                <ChevronDown className={`h-3 w-3 transition-transform duration-300 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 ${isLicenseNotesOpen ? 'transform rotate-180' : ''}`} />
                                            </button>
                                            {isLicenseNotesOpen && (
                                                <div className="whitespace-pre-line mt-1.5 p-2.5 bg-gray-50/80 dark:bg-gray-800/60 rounded-md text-xs border border-amber-200/60 dark:border-amber-800/30 animate-fadeIn shadow-sm">
                                                    {selectedCompany?.flow_licence_notes || 'Lisans notu bulunmamaktadır.'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Support Notes Card */}
                    <Card className="overflow-hidden shadow-sm border border-purple-200/80 dark:border-purple-800/50 bg-white dark:bg-gray-900/95 transition-all duration-300 hover:shadow-md">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-800/70 text-gray-700 dark:text-gray-300">
                                <div className="flex items-center">
                                    <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                    <span className="text-xs font-medium">Destek Notları</span>
                                </div>
                            </div>

                            <div>
                                <button
                                    onClick={() => setIsSupportNotesOpen(!isSupportNotesOpen)}
                                    className="w-full text-left flex items-center justify-between text-gray-700 dark:text-gray-300 text-xs font-medium py-1.5 px-2.5 rounded-md hover:bg-gray-50/80 dark:hover:bg-gray-800/60 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 focus:ring-opacity-50 group"
                                >
                                    <span className="flex items-center">
                                        <Info className="h-3 w-3 mr-1.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                                        Detaylar
                                    </span>
                                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 ${isSupportNotesOpen ? 'transform rotate-180' : ''}`} />
                                </button>
                                {isSupportNotesOpen && (
                                    <div className="whitespace-pre-line mt-1.5 p-2.5 bg-gray-50/80 dark:bg-gray-800/60 rounded-md text-xs border border-purple-200/60 dark:border-purple-800/30 animate-fadeIn shadow-sm min-h-[80px] max-h-[120px] overflow-y-auto">
                                        {selectedCompany?.flow_support_notes || 'Destek notu bulunmamaktadır.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Add a subtle animation keyframe for fade-in effect */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-3px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    )
}