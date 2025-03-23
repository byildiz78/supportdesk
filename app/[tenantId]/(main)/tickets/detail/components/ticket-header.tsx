"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, KeyRound, AlertCircle, ChevronDown, Info, MessageSquare, Clock, UserCheck, Calendar, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"

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
    createdAt
}: TicketHeaderProps) {
    const [isLicenseNotesOpen, setIsLicenseNotesOpen] = useState(false);
    const [isSupportNotesOpen, setIsSupportNotesOpen] = useState(false);
    
    // Durum için renk sınıfları ve ikonlar
    const statusColors = {
        new: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-700 dark:text-blue-300',
            border: 'border-blue-100 dark:border-blue-800',
            hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/30',
            icon: 'text-blue-500 dark:text-blue-400',
            gradient: 'from-blue-400 to-blue-600',
            iconComponent: HelpCircle
        },
        open: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-700 dark:text-emerald-300',
            border: 'border-emerald-100 dark:border-emerald-800',
            hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-800/30',
            icon: 'text-emerald-500 dark:text-emerald-400',
            gradient: 'from-emerald-400 to-emerald-600',
            iconComponent: AlertTriangle
        },
        resolved: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-700 dark:text-purple-300',
            border: 'border-purple-100 dark:border-purple-800',
            hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/30',
            icon: 'text-purple-500 dark:text-purple-400',
            gradient: 'from-purple-400 to-purple-600',
            iconComponent: CheckCircle2
        },
        closed: {
            bg: 'bg-gray-50 dark:bg-gray-800/30',
            text: 'text-gray-700 dark:text-gray-300',
            border: 'border-gray-100 dark:border-gray-700',
            hover: 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
            icon: 'text-gray-500 dark:text-gray-400',
            gradient: 'from-gray-400 to-gray-600',
            iconComponent: XCircle
        },
        default: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-100 dark:border-orange-800',
            hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/30',
            icon: 'text-orange-500 dark:text-orange-400',
            gradient: 'from-orange-400 to-orange-600',
            iconComponent: AlertCircle
        }
    };
    
    const currentStatus = statusColors[status as keyof typeof statusColors] || statusColors.default;
    const StatusIcon = currentStatus.iconComponent;
    
    return (
        <div className="mb-6">
            {/* Ana Container */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Ana Kart */}
                <Card className={`overflow-hidden border-0 shadow-lg rounded-2xl flex-1 transition-all duration-300 ${
                    isLicenseExpired 
                    ? 'bg-gradient-to-br from-red-50 to-red-50/70 dark:from-red-900/20 dark:to-red-900/5' 
                    : 'bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-800/70'
                }`}>
                    {/* Üst Renkli Şerit */}
                    <div className={`h-2 w-full bg-gradient-to-r ${currentStatus.gradient}`}></div>
                    
                    {/* İçerik */}
                    <div className="p-5">
                        {/* Başlık ve Bilet Numarası */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                    {title}
                                </h1>
                                <div className="flex items-center mt-2 text-sm text-gray-500 gap-3">
                                    <Badge 
                                        className={`px-2.5 py-1 rounded-full font-medium ${currentStatus.bg} ${currentStatus.text} ${currentStatus.hover} border ${currentStatus.border} flex items-center gap-1.5 shadow-sm`}
                                    >
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {status}
                                    </Badge>
                                    <span className="flex items-center gap-1.5 text-gray-500/90 dark:text-gray-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        {createdAt ? (
                                            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })}</span>
                                        ) : (
                                            "Tarih bilgisi yok"
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant="outline" className="px-3 py-1 text-sm font-medium rounded-full shadow-md border bg-white dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all">
                                    #{id}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Bilgi Kartları */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            {/* Oluşturan Kullanıcı */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-xl p-3.5 shadow-md border-0 hover:shadow-lg transition-all duration-300 group">
                                <div className="flex items-start gap-3">
                                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-lg shadow-md group-hover:scale-105 transition-transform">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">
                                            Oluşturan
                                        </h3>
                                        <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {createdByName && createdByName !== "Bilinmiyor" 
                                                ? createdByName
                                                : "Kullanıcı adı gösterilemiyor"}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Oluşturulma Tarihi */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-xl p-3.5 shadow-md border-0 hover:shadow-lg transition-all duration-300 group">
                                <div className="flex items-start gap-3">
                                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-md group-hover:scale-105 transition-transform">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">
                                            Tarih
                                        </h3>
                                        {createdAt ? (
                                            <div>
                                                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {format(new Date(createdAt), "dd.MM.yyyy")}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(createdAt), "HH:mm")}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-500">Tarih bilgisi yok</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Durum */}
                            <Card className="bg-white dark:bg-gray-800/40 rounded-xl p-3.5 shadow-md border-0 hover:shadow-lg transition-all duration-300 group">
                                <div className="flex items-start gap-3">
                                    <div className={`bg-gradient-to-br ${currentStatus.gradient} p-2 rounded-lg shadow-md group-hover:scale-105 transition-transform`}>
                                        <StatusIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">
                                            Durum
                                        </h3>
                                        <div className="mt-1">
                                            <Badge 
                                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentStatus.bg} ${currentStatus.text} ${currentStatus.hover} border ${currentStatus.border} flex items-center gap-1.5 shadow-sm`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Atanan Kullanıcı */}
                            <Card className={`${assignedTo ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10' : 'bg-white dark:bg-gray-800/40'} rounded-xl p-3.5 shadow-md border-0 hover:shadow-lg transition-all duration-300 group`}>
                                <div className="flex items-start gap-3">
                                    <div className={`${assignedTo ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} p-2 rounded-lg shadow-md group-hover:scale-105 transition-transform`}>
                                        <UserCheck className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">
                                            Atanan
                                        </h3>
                                        {assignedTo ? (
                                            <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                {assignedTo}
                                            </p>
                                        ) : (
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 px-2 py-0.5 text-xs">
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
                
                {/* BA Bilgileri ve Destek Notları yan yana */}
                <div className="flex flex-col gap-4 md:w-[300px]">
                    {/* License Information Card */}
                    {selectedCompany && selectedCompany.id && (
                        <Card className={`overflow-hidden shadow-lg rounded-xl border-0 ${isLicenseExpired 
                            ? 'bg-gradient-to-br from-red-50 to-red-50/70 dark:from-red-900/20 dark:to-red-900/5' 
                            : 'bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-800/70'}`}>
                            {/* Üst Renkli Şerit */}
                            <div className={`h-1.5 w-full ${isLicenseExpired ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>
                            
                            <div className="p-4">
                                <div className={`font-medium mb-2 flex items-center ${isLicenseExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    <KeyRound className={`h-4 w-4 mr-1.5 ${isLicenseExpired ? 'text-red-500' : 'text-gray-500'}`} />
                                    <span className="text-sm">
                                        BA Bilgileri
                                    </span>
                                </div>

                                {isLicenseExpired ? (
                                    <div className="flex items-center py-2 px-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-xs shadow-sm">
                                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            BA bulunmamaktadır
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
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
                                            <div className="mt-2 border-t border-gray-200 dark:border-gray-700/50 pt-2">
                                                <button
                                                    onClick={() => setIsLicenseNotesOpen(!isLicenseNotesOpen)}
                                                    className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors focus:outline-none"
                                                >
                                                    <span className="flex items-center">
                                                        <Info className="h-3.5 w-3.5 mr-1.5" />
                                                        Lisans Notları
                                                    </span>
                                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLicenseNotesOpen ? 'transform rotate-180' : ''}`} />
                                                </button>
                                                {isLicenseNotesOpen && (
                                                    <div className="whitespace-pre-line mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-xs shadow-sm">
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
                        <Card className="overflow-hidden shadow-lg rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-800/70">
                            {/* Üst Renkli Şerit */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                            
                            <div className="p-4">
                                <div className="font-medium mb-2 flex items-center text-gray-700 dark:text-gray-300">
                                    <MessageSquare className="h-4 w-4 mr-1.5 text-blue-500" />
                                    <span className="text-sm">
                                        Destek Notları
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setIsSupportNotesOpen(!isSupportNotesOpen)}
                                        className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors focus:outline-none"
                                    >
                                        <span className="flex items-center">
                                            <Info className="h-3.5 w-3.5 mr-1.5" />
                                            Detaylar
                                        </span>
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSupportNotesOpen ? 'transform rotate-180' : ''}`} />
                                    </button>
                                    {isSupportNotesOpen && (
                                        <div className="whitespace-pre-line mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-xs shadow-sm">
                                            {selectedCompany.flow_support_notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}