"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function UserHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Ayarları</h1>
                <p className="text-muted-foreground">
                    Sistem kullanıcılarını yönetin ve yeni kullanıcılar ekleyin.
                </p>
            </div>
            <Tabs defaultValue="all" className="w-full md:w-auto">
                <TabsList>
                    <TabsTrigger value="all">Tüm Kullanıcılar</TabsTrigger>
                    <TabsTrigger value="active">Aktif</TabsTrigger>
                    <TabsTrigger value="inactive">Pasif</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}
