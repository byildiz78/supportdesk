"use client"

import { Users } from "lucide-react"

export function UserHeader() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Ayarları</h1>
                    <p className="text-muted-foreground">
                        Sistem kullanıcılarını yönetin ve yeni kullanıcılar ekleyin.
                    </p>
                </div>
            </div>
        </div>
    )
}
