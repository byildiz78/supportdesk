"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'
import { useParentCompaniesStore } from '@/stores/main/parent-companies-store'

// Components
import { ParentCompanyHeader } from './components/ParentCompanyHeader'
import { ParentCompanyFilters } from './components/ParentCompanyFilters'
import { ParentCompanyList } from './components/ParentCompanyList'
import { ParentCompanyPagination } from './components/ParentCompanyPagination'
import axios from '@/lib/axios'
import { createExcelExportHandler, formatParentCompaniesData } from '@/lib/export-utils'
import { Card } from '@/components/ui/card'

export default function ParentCompaniesPage() {
    const { selectedFilter } = useFilterStore()
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const { parentCompanies, setParentCompanies } = useParentCompaniesStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [loading, setLoading] = useState(true)
    const [hasFetched, setHasFetched] = React.useState(false)
    const hasInitializedRef = React.useRef(false)
    const appliedAtRef = React.useRef(selectedFilter.appliedAt)
    const [error, setError] = useState<string | null>(null)

    // Ana şirketleri API'den çek
    const fetchParentCompanies = useCallback(async (isInitial = false) => {
        // Aktif tab kontrolü
        if (activeTab !== "Ana Firmalar") {
            return
        }

        try {
            setLoading(true)
            const response = await axios.post('/api/main/parent-companies/parent-companiesList', {
            })
            if (response.data) {
                setParentCompanies(response.data)
            }
        } catch (err) {
            console.error('Ana şirketler yüklenirken hata:', err)
            setError('Ana şirketler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }, [selectedFilter.selectedBranches, setParentCompanies, activeTab])

    // Component ilk mount olduğunda bir kez çalışır
    useEffect(() => {
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            fetchParentCompanies(true)
        }
    }, []) // Boş dependency array ile sadece bir kez çalışır

    // Filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            fetchParentCompanies(false)
        }
    }, [selectedFilter.appliedAt, fetchParentCompanies]) // Sadece appliedAt değiştiğinde çalışır

    // selectedBranches değişikliklerini izle
    useEffect(() => {
        if (hasFetched) {
            fetchParentCompanies(false)
        }
    }, [fetchParentCompanies, hasFetched])

    const handleNewParentCompany = () => {
        const tabId = "Yeni Ana Şirket"
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)

        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: "Yeni Ana Şirket",
                lazyComponent: () => import('./crud-components/CreateParentCompany').then(module => ({
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

    const handleCompanyDeleted = (companyId: string) => {
        // Şirket silindikten sonra listeyi güncelle
        fetchParentCompanies(false)
    }

    const filteredCompanies = parentCompanies.filter(company => {
        const matchesSearch =
            company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.city?.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    const total = filteredCompanies.length
    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExportToExcel = createExcelExportHandler(
        () => filteredCompanies, 
        'Ana Şirketler',
        formatParentCompaniesData
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <ParentCompanyHeader
                onNewCompany={handleNewParentCompany}
                onExportToExcel={handleExportToExcel}
            />
            <ParentCompanyFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
            />

            {/* Customer List Table */}
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <ParentCompanyList
                        companies={paginatedCompanies}
                        isLoading={loading}
                        error={error}
                        onCompanyDeleted={handleCompanyDeleted}
                    />
                    {/* Pagination */}
                    <ParentCompanyPagination
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={total}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
            </Card>
        </div>
    )
}
