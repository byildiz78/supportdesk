"use client"

import React from "react"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { BaseTicketComponentProps } from "./types"

interface TicketDatesInfoProps extends BaseTicketComponentProps {
    createdAt?: string;
    updatedAt?: string;
    dueDate?: string;
}

const TicketDatesInfo: React.FC<TicketDatesInfoProps> = ({
    createdAt,
    updatedAt,
    dueDate
}) => {
    // Format date with Turkish locale
    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: tr });
        } catch (error) {
            console.error("Date formatting error:", error);
            return dateString;
        }
    };

    return (
        <div>
            <h3 className="text-sm font-semibold mb-1.5">Tarih Bilgileri</h3>
            <div className="border rounded-md p-2 space-y-1.5">
                {createdAt && (
                    <div className="flex items-center text-xs">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500 mr-1">Oluşturulma:</span>
                        <span>{formatDate(createdAt)}</span>
                    </div>
                )}
                
                {updatedAt && (
                    <div className="flex items-center text-xs">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500 mr-1">Son Güncelleme:</span>
                        <span>{formatDate(updatedAt)}</span>
                    </div>
                )}
                
                {dueDate && (
                    <div className="flex items-center text-xs">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500 mr-1">Bitiş Tarihi:</span>
                        <span>{formatDate(dueDate)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDatesInfo;
