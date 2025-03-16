"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { useCompaniesStore } from "@/stores/main/companies-store"
import { CompanyList } from "./components/CompanyList"
import { CompanyHeader } from "./components/CompanyHeader"
import { CompanyFilters } from "./components/CompanyFilters"
import { CompanyPagination } from "./components/CompanyPagination"
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'
import axios from '@/lib/axios'
import { createExcelExportHandler } from '@/lib/export-utils'

export default function CompaniesPage() {
    const { selectedFilter } = useFilterStore()
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const { companies, setCompanies, setLoading, isLoading } = useCompaniesStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [hasFetched, setHasFetched] = useState(false)
    const [localBranchFilter, setLocalBranchFilter] = useState(selectedFilter.branches)
    const hasInitializedRef = React.useRef(false)
    const appliedAtRef = React.useRef(selectedFilter.appliedAt)
    const [error, setError] = useState<string | null>(null)

    // Şirketleri API'den çek
    const fetchCompanies = useCallback(async (isInitial = false) => {
        // Aktif tab kontrolü
        if (activeTab !== "Firmalar") {
            return
        }

        try {
            setLoading(true)
            // selectedBranches'ı doğru şekilde işle
            let branchParam = selectedFilter.selectedBranches.length > 0
                ? selectedFilter.selectedBranches
                : selectedFilter.branches

            // API'ye gönderilecek değeri hazırla
            if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
                // Boş dizi durumunda boş dizi gönder, null değil
                branchParam = []
            }
            
            const response = await axios.post('/api/main/companies/companiesList', {
                tenantId: branchParam
            })
            
            if (response.data) {
                setCompanies(response.data)
            }
        } catch (err) {
            console.error('Şirketler yüklenirken hata:', err)
            setError('Şirketler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }, [selectedFilter.selectedBranches, setCompanies, activeTab, setLoading])

    // Component ilk mount olduğunda bir kez çalışır
    useEffect(() => {
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            fetchCompanies(true)
        }
    }, []) // Boş dependency array ile sadece bir kez çalışır

    // Filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            fetchCompanies(false)
        }
    }, [selectedFilter.appliedAt, fetchCompanies]) // Sadece appliedAt değiştiğinde çalışır

    // selectedBranches değişikliklerini izle
    useEffect(() => {
        if (hasFetched) {
            fetchCompanies(false)
        }
    }, [selectedFilter.selectedBranches, fetchCompanies, hasFetched])

    useEffect(() => {
        if (selectedFilter.branches !== localBranchFilter) {
            setLocalBranchFilter(selectedFilter.branches)
        }
    }, [selectedFilter.branches, localBranchFilter])

    const handleNewCompany = () => {
        const tabId = "Yeni Şirket"
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)

        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: "Yeni Şirket",
                lazyComponent: () => import('@/app/[tenantId]/(main)/companies/crud-components/CreateCompany').then(module => ({
                    default: (props: any) => <module.default {...props} />
                }))
            })
        }
        setActiveTab(tabId)
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1) // Arama yapıldığında ilk sayfaya dön
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value)
        setCurrentPage(1) // Sayfa başına öğe sayısı değiştiğinde ilk sayfaya dön
    }

    const handleCompanyDeleted = () => {
        // Şirket silindikten sonra listeyi güncelle
        fetchCompanies(false)
    }

    // Filter companies based on search term
    const filteredCompanies = companies.filter(company => 
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalCompanies = filteredCompanies.length
    const totalPages = Math.ceil(totalCompanies / itemsPerPage)
    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExportToExcel = createExcelExportHandler(
        paginatedCompanies,
        'Şirketler'
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <CompanyHeader 
                onNewCompany={handleNewCompany}
                onExportToExcel={handleExportToExcel}
            />
            
            <CompanyFilters 
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <CompanyList 
                        companies={paginatedCompanies}
                        isLoading={isLoading}
                        error={error}
                        onCompanyDeleted={handleCompanyDeleted}
                    />
                    
                    <CompanyPagination 
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalCompanies}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
            </Card>
        </div>
    )
}