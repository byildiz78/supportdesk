"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, KeyRound, AlertCircle, ChevronDown, Info, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

interface TicketHeaderProps {
    id: string;
    title: string;
    createdBy: string | null;
    selectedCompany: any;
    isLicenseExpired: boolean;
}

export function TicketHeader({ id, title, createdBy, selectedCompany, isLicenseExpired }: TicketHeaderProps) {
    const [isLicenseNotesOpen, setIsLicenseNotesOpen] = useState(false);
    const [isSupportNotesOpen, setIsSupportNotesOpen] = useState(false);
    
    return (
        <div className="flex flex-row items-stretch gap-4 mb-4">
            {/* Ticket Information Card */}
            <Card className={`p-6 flex-1 flex flex-col justify-center shadow-md ${
                selectedCompany && selectedCompany.id && isLicenseExpired 
                ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
            }`}>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h1>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{createdBy} tarafından oluşturuldu</span>
                        <Badge variant="outline" className="ml-2 px-2 py-0 text-xs">#{id}</Badge>
                    </div>
                </div>
            </Card>
            
            {/* License Information Card */}
            {selectedCompany && selectedCompany.id && (
                <Card className={`p-3 shadow-md min-w-[250px] flex flex-col ${isLicenseExpired 
                    ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800' 
                    : 'bg-white dark:bg-gray-800'}`}>
                    <div className={`font-semibold mb-2 flex items-center ${isLicenseExpired ? 'text-red-600 dark:text-red-400' : ''}`}>
                        <KeyRound className={`h-3.5 w-3.5 mr-1.5 ${isLicenseExpired ? 'text-red-500' : 'text-blue-500'}`} />
                        <span className="text-sm">
                            BA Bilgileri
                        </span>
                    </div>

                    {isLicenseExpired ? (
                        <div className="flex items-center py-1.5 px-2 bg-red-200 dark:bg-red-900/60 rounded-md">
                            <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                BA bulunmamaktadır
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="font-medium text-gray-500 dark:text-gray-400">Başlangıç:</div>
                                <div className="font-semibold">
                                    {selectedCompany.flow_ba_starting_date ?
                                        format(new Date(selectedCompany.flow_ba_starting_date), 'dd.MM.yyyy') :
                                        'Belirtilmemiş'}
                                </div>

                                <div className="font-medium text-gray-500 dark:text-gray-400">Bitiş:</div>
                                <div className="font-semibold">
                                    {selectedCompany.flow_ba_end_date ?
                                        format(new Date(selectedCompany.flow_ba_end_date), 'dd.MM.yyyy') :
                                        'Belirtilmemiş'}
                                </div>
                            </div>

                            {selectedCompany.flow_licence_notes && (
                                <div className="mt-1 border-t pt-1">
                                    <button
                                        onClick={() => setIsLicenseNotesOpen(!isLicenseNotesOpen)}
                                        className="w-full text-left flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-medium focus:outline-none"
                                    >
                                        <span className="flex items-center">
                                            <Info className="h-3 w-3 mr-1" />
                                            Lisans Notları
                                        </span>
                                        <ChevronDown className={`h-3 w-3 transition-transform ${isLicenseNotesOpen ? 'transform rotate-180' : ''}`} />
                                    </button>
                                    {isLicenseNotesOpen && (
                                        <div className="whitespace-pre-line mt-1.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                            {selectedCompany.flow_licence_notes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}
            
            {/* Support Notes Card - New separate card */}
            {selectedCompany && selectedCompany.id && selectedCompany.flow_support_notes && (
                <Card className="p-3 shadow-md min-w-[250px] flex flex-col bg-white dark:bg-gray-800">
                    <div className="font-semibold mb-2 flex items-center">
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        <span className="text-sm">
                            Destek Notları
                        </span>
                    </div>
                    
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsSupportNotesOpen(!isSupportNotesOpen)}
                            className="w-full text-left flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-medium focus:outline-none"
                        >
                            <span className="flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                Detaylar
                            </span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isSupportNotesOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                        {isSupportNotesOpen && (
                            <div className="whitespace-pre-line mt-1.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                                {selectedCompany.flow_support_notes}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}