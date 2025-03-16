"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface UserFiltersProps {
    searchTerm: string
    setSearchTerm: (value: string) => void
}

export function UserFilters({ searchTerm, setSearchTerm }: UserFiltersProps) {
    return (
        <div className="flex items-center gap-2 w-full md:w-1/3">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Kullanıcı ara..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    )
}
