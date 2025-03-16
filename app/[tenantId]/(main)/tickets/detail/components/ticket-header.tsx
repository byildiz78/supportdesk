"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

interface TicketHeaderProps {
    id: string;
    title: string;
    createdBy: string | null;
}

export function TicketHeader({ id, title, createdBy }: TicketHeaderProps) {
    return (
        <Card className="p-6 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h1>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        {createdBy} tarafından oluşturuldu
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        #{id}
                    </Badge>
                </div>
            </div>
        </Card>
    )
}
