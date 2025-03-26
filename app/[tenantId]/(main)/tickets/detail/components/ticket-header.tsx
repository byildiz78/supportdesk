"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, KeyRound, AlertCircle, ChevronDown, Info, MessageSquare, Clock, UserCheck, Calendar, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"
import { getStatusChange } from "@/lib/utils"

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
    resolution_notes
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
        default: {
            bg: 'bg-orange-50 dark:bg-orange-900/10',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-100 dark:border-orange-800/50',
            hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/20',
            gradient: 'from-orange-400 to-orange-600',
            iconComponent: AlertCircle
        }
    };

    const currentStatus = statusColors[status as keyof typeof statusColors] || statusColors.default;
    const StatusIcon = currentStatus.iconComponent;

    return (
        <div className="mb-4">
            {/* Main Container */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Main Card */}
                <Card className={`overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl flex-1 transition-all duration-200 ${isLicenseExpired
                    ? 'bg-gradient-to-br from-red-50/80 to-red-50/40 dark:from-red-900/10 dark:to-red-900/5'
                    : 'bg-white dark:bg-gray-800/80'
                    }`}>
                    {/* Top Color Strip */}
                    <div className={`h-1 w-full bg-gradient-to-r ${currentStatus.gradient}`}></div>

                    {/* Content */}
                    <div className="p-4">
                        {/* Title and Ticket Number */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                                    {title}
                                </h1>
                                <div className="flex items-center mt-1.5 text-xs text-gray-500 gap-2">
                                    <Badge
                                        className={`px-2 py-0.5 rounded-full font-medium ${currentStatus.bg} ${currentStatus.text} ${currentStatus.hover} border ${currentStatus.border} flex items-center gap-1 shadow-sm`}
                                    >
                                        <StatusIcon className="h-3 w-3" />
                                        {getStatusChange(status)}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-gray-500/90 dark:text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {createdAt ? (
                                            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })}</span>
                                        ) : (
                                            "Tarih bilgisi yok"
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm border bg-white dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all">
                                    #{id}
                                </Badge>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                            {/* Created By */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-lg p-2.5 shadow-sm border-0 hover:shadow-md transition-all duration-200 group">
                                <div className="flex items-start gap-2">
                                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-1.5 rounded-md shadow-sm group-hover:scale-105 transition-transform">
                                        <User className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                                            Oluşturan
                                        </h3>
                                        <p className="mt-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                                            {createdByName && createdByName !== "Bilinmiyor"
                                                ? createdByName
                                                : "Kullanıcı adı gösterilemiyor"}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Created Date */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-lg p-2.5 shadow-sm border-0 hover:shadow-md transition-all duration-200 group">
                                <div className="flex items-start gap-2">
                                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-1.5 rounded-md shadow-sm group-hover:scale-105 transition-transform">
                                        <Calendar className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                                            Tarih
                                        </h3>
                                        {createdAt ? (
                                            <div>
                                                <p className="mt-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                                                    {format(new Date(createdAt), "dd.MM.yyyy")}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {format(new Date(createdAt), "HH:mm")}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-gray-500">Tarih bilgisi yok</p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Status */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-lg p-2.5 shadow-sm border-0 hover:shadow-md transition-all duration-200 group">
                                <div className="flex items-start gap-2">
                                    <div className={`bg-gradient-to-br ${currentStatus.gradient} p-1.5 rounded-md shadow-sm group-hover:scale-105 transition-transform`}>
                                        <StatusIcon className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                                            Durum
                                        </h3>
                                        <div className="mt-0.5">
                                            <Badge
                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${currentStatus.bg} ${currentStatus.text} ${currentStatus.hover} border ${currentStatus.border} flex items-center gap-1 shadow-sm`}
                                            >
                                                <StatusIcon className="h-2.5 w-2.5" />
                                                {getStatusChange(status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Assigned To */}
                            <Card className={`${assignedTo ? 'bg-gradient-to-br from-blue-50/70 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5' : 'bg-white dark:bg-gray-800/40'} rounded-lg p-2.5 shadow-sm border-0 hover:shadow-md transition-all duration-200 group`}>
                                <div className="flex items-start gap-2">
                                    <div className={`${assignedTo ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} p-1.5 rounded-md shadow-sm group-hover:scale-105 transition-transform`}>
                                        <UserCheck className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                                            Atanan
                                        </h3>
                                        {assignedTo ? (
                                            <p className="mt-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                {assignedTo}
                                            </p>
                                        ) : (
                                            <div className="mt-0.5 flex items-center">
                                                <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 px-1.5 py-0.5 text-xs">
                                                    Atanmamış
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Card>

                {/* License Info and Support Notes side by side */}
                <div className="flex flex-col gap-3 md:w-[260px]">
                    {/* License Information Card */}
                    {selectedCompany && selectedCompany.id && (
                        <Card className={`overflow-hidden shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 ${isLicenseExpired
                            ? 'bg-gradient-to-br from-red-50/80 to-red-50/40 dark:from-red-900/10 dark:to-red-900/5'
                            : 'bg-white dark:bg-gray-800/80'}`}>
                            {/* Top Color Strip */}
                            <div className={`h-0.5 w-full ${isLicenseExpired ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>

                            <div className="p-3">
                                <div className={`font-medium mb-1.5 flex items-center ${isLicenseExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    <KeyRound className={`h-3.5 w-3.5 mr-1 ${isLicenseExpired ? 'text-red-500' : 'text-gray-500'}`} />
                                    <span className="text-xs">
                                        BA Bilgileri
                                    </span>
                                </div>

                                {isLicenseExpired ? (
                                    <div className="flex items-center py-1.5 px-2 bg-red-100 dark:bg-red-900/20 rounded-md text-xs shadow-sm">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            BA bulunmamaktadır
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                                            <div className="font-medium text-gray-500 dark:text-gray-400">Başlangıç:</div>
                                            <div className="font-medium text-gray-700 dark:text-gray-300">
                                                {selectedCompany.flow_ba_starting_date ?
                                                    format(new Date(selectedCompany.flow_ba_starting_date), 'dd.MM.yyyy') :
                                                    'Belirtilmemiş'}
                                            </div>

                                            <div className="font-medium text-gray-500 dark:text-gray-400">Bitiş:</div>
                                            <div className="font-medium text-gray-700 dark:text-gray-300">
                                                {selectedCompany.flow_ba_end_date ?
                                                    format(new Date(selectedCompany.flow_ba_end_date), 'dd.MM.yyyy') :
                                                    'Belirtilmemiş'}
                                            </div>
                                        </div>

                                        {selectedCompany.flow_licence_notes && (
                                            <div className="mt-1.5 border-t border-gray-200 dark:border-gray-700/50 pt-1.5">
                                                <button
                                                    onClick={() => setIsLicenseNotesOpen(!isLicenseNotesOpen)}
                                                    className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors focus:outline-none"
                                                >
                                                    <span className="flex items-center">
                                                        <Info className="h-3 w-3 mr-1" />
                                                        Lisans Notları
                                                    </span>
                                                    <ChevronDown className={`h-3 w-3 transition-transform ${isLicenseNotesOpen ? 'transform rotate-180' : ''}`} />
                                                </button>
                                                {isLicenseNotesOpen && (
                                                    <div className="whitespace-pre-line mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-md text-xs shadow-sm">
                                                        {selectedCompany.flow_licence_notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Support Notes Card */}
                    {selectedCompany && selectedCompany.id && selectedCompany.flow_support_notes && (
                        <Card className="overflow-hidden shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80">
                            {/* Top Color Strip */}
                            <div className="h-0.5 w-full bg-gradient-to-r from-blue-400 to-blue-500"></div>

                            <div className="p-3">
                                <div className="font-medium mb-1.5 flex items-center text-gray-700 dark:text-gray-300">
                                    <MessageSquare className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                    <span className="text-xs">
                                        Destek Notları
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <button
                                        onClick={() => setIsSupportNotesOpen(!isSupportNotesOpen)}
                                        className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors focus:outline-none"
                                    >
                                        <span className="flex items-center">
                                            <Info className="h-3 w-3 mr-1" />
                                            Detaylar
                                        </span>
                                        <ChevronDown className={`h-3 w-3 transition-transform ${isSupportNotesOpen ? 'transform rotate-180' : ''}`} />
                                    </button>
                                    {isSupportNotesOpen && (
                                        <div className="whitespace-pre-line mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-md text-xs shadow-sm">
                                            {selectedCompany.flow_support_notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Çözüm Bilgileri - Status resolved ise göster */}
            {status === "resolved" && (
                <Card className="overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-3">
                    {/* Left Accent Border instead of top strip for better design */}
                    <div className="flex">
                        <div className="w-1 bg-purple-500 dark:bg-purple-600 self-stretch"></div>

                        <div className="flex-1 p-3">
                            <div className="font-medium mb-2 flex items-center text-gray-800 dark:text-gray-200">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs">
                                    Çözüm Bilgileri
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {resolution_notes && (
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Çözüm Notları
                                            </h3>
                                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded">
                                                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                    {resolution_notes}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Durum
                                        </h3>
                                        <div className="mt-1">
                                            <Badge
                                                className="px-2 py-0.5 text-xs font-medium rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                {getStatusChange(status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}