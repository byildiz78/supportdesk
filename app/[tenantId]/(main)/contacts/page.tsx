"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { useContactsStore } from "@/stores/main/contacts-store"
import { ContactList } from "./components/ContactList"
import { ContactHeader } from "./components/ContactHeader"
import { ContactFilters } from "./components/ContactFilters"
import { ContactPagination } from "./components/ContactPagination"
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'
import axios from '@/lib/axios'
import { createExcelExportHandler } from '@/lib/export-utils'

export default function ContactsPage() {
    const { selectedFilter } = useFilterStore()
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const { contacts, setContacts, setLoading, isLoading } = useContactsStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [hasFetched, setHasFetched] = useState(false)
    const [localBranchFilter, setLocalBranchFilter] = useState(selectedFilter.branches)
    const hasInitializedRef = React.useRef(false)
    const appliedAtRef = React.useRef(selectedFilter.appliedAt)
    const [error, setError] = useState<string | null>(null)
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

    // Fetch contacts from API
    const fetchContacts = useCallback(async (isInitial = false) => {
        // Check active tab
        if (activeTab !== "Kişiler") {
            return
        }

        try {
            setLoading(true)
            // Handle selected branches
            let branchParam = selectedFilter.selectedBranches.length > 0
                ? selectedFilter.selectedBranches
                : selectedFilter.branches

            // Prepare value for API
            if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
                // Send empty array, not null
                branchParam = []
            }
            
            const response = await axios.post('/api/main/contacts/contactsList', {
                tenantId: branchParam,
                companyId: selectedCompanyId
            })
            
            if (response.data) {
                setContacts(response.data)
            }
        } catch (err) {
            console.error('Error loading contacts:', err)
            setError('Kişiler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }, [selectedFilter.selectedBranches, setContacts, activeTab, setLoading, selectedCompanyId])

    // Run once on component mount
    useEffect(() => {
        // Only run once
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            fetchContacts(true)
        }
    }, []) // Empty dependency array to run once

    // Watch for filter changes
    useEffect(() => {
        // Check if filter has changed
        if (selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            fetchContacts(false)
        }
    }, [selectedFilter.appliedAt, fetchContacts]) // Only run when appliedAt changes

    // Watch for selectedBranches changes
    useEffect(() => {
        if (hasFetched) {
            fetchContacts(false)
        }
    }, [selectedFilter.selectedBranches, fetchContacts, hasFetched])

    useEffect(() => {
        if (selectedFilter.branches !== localBranchFilter) {
            setLocalBranchFilter(selectedFilter.branches)
        }
    }, [selectedFilter.branches, localBranchFilter])

    // Watch for company filter changes
    useEffect(() => {
        if (selectedCompanyId !== null) {
            fetchContacts(false)
        }
    }, [selectedCompanyId, fetchContacts])

    const handleNewContact = () => {
        const tabId = "Yeni Kişi"
        // Check if tab is already open
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)

        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: "Yeni Kişi",
                lazyComponent: () => import('@/app/[tenantId]/(main)/contacts/crud-components/CreateContact').then(module => ({
                    default: (props: any) => <module.default {...props} companyId={selectedCompanyId} />
                }))
            })
        }
        setActiveTab(tabId)
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1) // Reset to first page on search
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value)
        setCurrentPage(1) // Reset to first page when items per page changes
    }

    const handleContactDeleted = () => {
        // Refresh list after contact is deleted
        fetchContacts(false)
    }

    const handleCompanyFilterChange = (companyId: string | null) => {
        setSelectedCompanyId(companyId)
        setCurrentPage(1) // Reset to first page when filter changes
    }

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(contact => 
        contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalContacts = filteredContacts.length
    const totalPages = Math.ceil(totalContacts / itemsPerPage)
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExportToExcel = createExcelExportHandler(
        paginatedContacts,
        'Kişiler'
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <ContactHeader 
                onNewContact={handleNewContact}
                onExportToExcel={handleExportToExcel}
            />
            
            <ContactFilters 
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                selectedCompanyId={selectedCompanyId}
                onCompanyFilterChange={handleCompanyFilterChange}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <ContactList 
                        contacts={paginatedContacts}
                        isLoading={isLoading}
                        error={error}
                        onContactDeleted={handleContactDeleted}
                    />
                    
                    <ContactPagination 
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalContacts}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
            </Card>
        </div>
    )
}
