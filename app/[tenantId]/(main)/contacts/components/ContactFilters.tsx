"use client"

import { Input } from "@/components/ui/input"
import { Search, Building } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompaniesStore } from "@/stores/main/companies-store"
import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import { useFilterStore } from "@/stores/filters-store"

export interface ContactFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCompanyId: string | null;
    onCompanyFilterChange: (companyId: string | null) => void;
}

export function ContactFilters({ 
    searchTerm, 
    onSearchChange, 
    selectedCompanyId, 
    onCompanyFilterChange 
}: ContactFiltersProps) {
    const { companies, setCompanies } = useCompaniesStore()
    const { selectedFilter } = useFilterStore()
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

    // Fetch companies for the dropdown
    useEffect(() => {
        const fetchCompanies = async () => {
            if (companies.length === 0) {
                try {
                    setIsLoadingCompanies(true)
                    
                    // Handle selected branches
                    let branchParam = selectedFilter.selectedBranches.length > 0
                        ? selectedFilter.selectedBranches
                        : selectedFilter.branches

                    // Prepare value for API
                    if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
                        // Send empty array, not null
                        branchParam = []
                    }
                    
                    const response = await axios.post('/api/main/companies/companiesList', {
                        tenantId: branchParam
                    })
                    
                    if (response.data) {
                        setCompanies(response.data)
                    }
                } catch (error) {
                    console.error('Error loading companies for filter:', error)
                } finally {
                    setIsLoadingCompanies(false)
                }
            }
        }

        fetchCompanies()
    }, [companies.length, setCompanies, selectedFilter.branches, selectedFilter.selectedBranches])

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Kişi ara..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="w-full sm:w-64">
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Select
                        value={selectedCompanyId || ""}
                        onValueChange={(value) => onCompanyFilterChange(value === "" ? null : value)}
                    >
                        <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Firmaya göre filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tüm Firmalar</SelectItem>
                            {companies.map(company => (
                                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
