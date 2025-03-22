"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { TicketFilter } from "@/types/tickets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useUsers, User } from "@/providers/users-provider"

interface TicketFiltersProps {
    searchTerm: string
    setSearchTerm: (value: string) => void
    filters?: TicketFilter
    onFilterChange?: (filters: Partial<TicketFilter>) => void
    disableStatusFilter?: boolean
}

export function TicketFilters({ 
    searchTerm, 
    setSearchTerm, 
    filters = {}, 
    onFilterChange = () => {}, 
    disableStatusFilter = false 
}: TicketFiltersProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const { users, isLoading: isLoadingUsers } = useUsers()
    
    // Count active filters
    const getActiveFilterCount = () => {
        let count = 0
        if (filters.status && filters.status.length > 0) count++
        if (filters.priority && filters.priority.length > 0) count++
        if (filters.category && filters.category.length > 0) count++
        if (filters.assigned_to && filters.assigned_to.length > 0) count++
        if (filters.parent_company_id && filters.parent_company_id.length > 0) count++
        if (filters.company_id && filters.company_id.length > 0) count++
        if (filters.date_range) count++
        if (filters.sla_breach !== undefined) count++
        return count
    }
    
    const activeFilterCount = getActiveFilterCount()

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-2 border-blue-100/50 dark:border-blue-900/20 shadow-lg shadow-blue-500/5">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                                <Input
                                    placeholder="Talep ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white/80 dark:bg-gray-800/80 border-2 border-blue-100 dark:border-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="relative">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filtreler
                                        {activeFilterCount > 0 && (
                                            <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">{activeFilterCount}</Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Filtreler</h4>
                                        
                                        <div className="space-y-2">
                                            {!disableStatusFilter && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Durum</label>
                                                    <Select
                                                        value={filters.status?.[0] || ""}
                                                        onValueChange={(value) => onFilterChange({ status: value ? [value] : [] })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Tüm durumlar" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">Tüm durumlar</SelectItem>
                                                            <SelectItem value="open">Açık</SelectItem>
                                                            <SelectItem value="in_progress">İşlemde</SelectItem>
                                                            <SelectItem value="pending">Beklemede</SelectItem>
                                                            <SelectItem value="resolved">Çözüldü</SelectItem>
                                                            <SelectItem value="closed">Kapalı</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <label className="text-sm font-medium">Öncelik</label>
                                            <Select
                                                value={filters.priority?.[0] || ""}
                                                onValueChange={(value) => onFilterChange({ priority: value ? [value] : [] })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tüm öncelikler" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">Tüm öncelikler</SelectItem>
                                                    <SelectItem value="low">Düşük</SelectItem>
                                                    <SelectItem value="medium">Orta</SelectItem>
                                                    <SelectItem value="high">Yüksek</SelectItem>
                                                    <SelectItem value="urgent">Acil</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Atanan Kullanıcı</label>
                                            <Select
                                                value={filters.assigned_to?.[0] || ""}
                                                onValueChange={(value) => {
                                                    const newValue = value ? [value] : [];
                                                    onFilterChange({ assigned_to: newValue });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tüm kullanıcılar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">Tüm kullanıcılar</SelectItem>
                                                    {isLoadingUsers ? (
                                                        <SelectItem value="" disabled>Yükleniyor...</SelectItem>
                                                    ) : (
                                                        users.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <Button 
                                            onClick={() => {
                                                onFilterChange({
                                                    status: [],
                                                    priority: [],
                                                    category: [],
                                                    assigned_to: [],
                                                    parent_company_id: [],
                                                    company_id: [],
                                                    date_range: null,
                                                    sla_breach: undefined
                                                })
                                                setIsFilterOpen(false)
                                            }}
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full mt-2"
                                        >
                                            Filtreleri Temizle
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
