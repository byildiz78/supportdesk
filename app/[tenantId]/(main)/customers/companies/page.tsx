"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { useCustomersStore } from "@/stores/customers-store"
import { CompanyList } from "./components/CompanyList"
import { CompanyHeader } from "./components/CompanyHeader"
import { CompanyFilters } from "./components/CompanyFilters"
import { CompanyPagination } from "./components/CompanyPagination"

export default function CompaniesPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const { companies, isLoading } = useCustomersStore()

    // Filter companies based on search term
    const filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalCompanies = filteredCompanies.length
    const totalPages = Math.ceil(totalCompanies / itemsPerPage)
    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <CompanyHeader />
            
            <CompanyFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <CompanyList 
                        companies={paginatedCompanies}
                        isLoading={isLoading}
                    />
                    
                    <CompanyPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCompanies={totalCompanies}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    )
}