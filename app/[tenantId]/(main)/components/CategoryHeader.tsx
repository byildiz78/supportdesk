"use client"

import { useTabStore } from "@/stores/tab-store"

function CategoryHeader() {
    const { activeTab } = useTabStore()

    return (
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Grup Kategori Yönetimi</h1>
            <p className="text-muted-foreground">
                Destek taleplerinde kullanılacak kategori, alt kategori ve grupları yönetin.
            </p>
        </div>
    )
}

export default CategoryHeader
