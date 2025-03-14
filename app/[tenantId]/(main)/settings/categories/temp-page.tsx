"use client"

import { useState, useEffect } from "react"
import { useCategoryStore } from "@/stores/category-store"
import { mockCategories } from "../data/mock-categories"

export default function CategoryManagementPage() {
    const { setCategories } = useCategoryStore()

    // Load mock data
    useEffect(() => {
        setCategories(mockCategories)
    }, [setCategories])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2">
            <h1 className="text-2xl font-bold tracking-tight">Grup Kategori Yönetimi</h1>
            <p className="text-muted-foreground">
                Destek taleplerinde kullanılacak kategori, alt kategori ve grupları yönetin.
            </p>
        </div>
    )
}
