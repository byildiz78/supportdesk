"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ParentCompanyFiltersProps {
    searchTerm: string
    onSearchChange: (value: string) => void
}

export function ParentCompanyFilters({ searchTerm, onSearchChange }: ParentCompanyFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Ana firma ara..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    )
}
