"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'
import { useContactsStore } from '@/stores/main/contacts-store'
import { useCompanies } from '@/providers/companies-provider'

// Components

import axios from '@/lib/axios'
import { createExcelExportHandler, formatContactsData } from '@/lib/export-utils'
import { Card } from '@/components/ui/card'
import { ContactHeader } from './components/ContactHeader'
import { ContactFilters } from './components/ContactFilters'
import { ContactList } from './components/ContactList'
import { ContactPagination } from './components/ContactPagination'

export default function ContactsPage() {
    const { selectedFilter } = useFilterStore()
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const { contacts, setContacts, setLoading: setStoreLoading } = useContactsStore()
    const { companies } = useCompanies()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [loading, setLoading] = useState(true)
    const [hasFetched, setHasFetched] = React.useState(false)
    const hasInitializedRef = React.useRef(false)
    const appliedAtRef = React.useRef(selectedFilter.appliedAt)
    const [error, setError] = useState<string | null>(null)

    // Kişileri API'den çek
    const fetchContacts = useCallback(async (isInitial = false) => {
        // Aktif tab kontrolü
        if (activeTab !== "Kişiler") {
            return
        }

        try {
            setLoading(true)
            setStoreLoading(true)
            const response = await axios.post('/api/main/contacts/contactsList', {
                companyId: selectedFilter.selectedCompany
            })
            if (response.data) {
                setContacts(response.data)
            }
        } catch (err) {
            console.error('Kişiler yüklenirken hata:', err)
            setError('Kişiler yüklenemedi')
        } finally {
            setLoading(false)
            setStoreLoading(false)
        }
    }, [selectedFilter.selectedCompany, setContacts, activeTab, setStoreLoading])

    // Component ilk mount olduğunda bir kez çalışır
    useEffect(() => {
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            fetchContacts(true)
        }
    }, []) // Boş dependency array ile sadece bir kez çalışır

    // Filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            fetchContacts(false)
        }
    }, [selectedFilter.appliedAt, fetchContacts]) // Sadece appliedAt değiştiğinde çalışır

    // selectedCompany değişikliklerini izle
    useEffect(() => {
        if (hasFetched) {
            fetchContacts(false)
        }
    }, [fetchContacts, hasFetched])

    const handleNewContact = () => {
        const tabId = "Yeni Kişi"
        // Sekme zaten açık mı kontrol et
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)

        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: "Yeni Kişi",
                lazyComponent: () => import('@/app/[tenantId]/(main)/contacts/crud-components/CreateContact').then(module => ({
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

    const handleContactDeleted = (contactId: string) => {
        // Kişi silindikten sonra listeyi güncelle
        fetchContacts(false)
    }

    const filteredContacts = contacts.filter(contact => {
        // Firma adını bul
        let companyName = "-";
        if (contact.companyId) {
            const company = companies.find((c) => c.id === contact.companyId);
            companyName = company ? company.name : "-";
        }

        const matchesSearch =
            `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            companyName.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    // Şirket adlarını içeren genişletilmiş kişi listesi oluştur (Excel dışa aktarma için)
    const contactsWithCompanyNames = filteredContacts.map(contact => {
        let companyName = "-";
        if (contact.companyId) {
            const company = companies.find((c) => c.id === contact.companyId);
            companyName = company ? company.name : "-";
        }
        
        // Yeni bir nesne oluştur, orijinal contact nesnesini değiştirmeden
        return {
            ...contact,
            companyName
        };
    });

    const total = filteredContacts.length
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Excel dışa aktarma için şirket adlarını içeren listeyi kullan
    const handleExportToExcel = createExcelExportHandler(
        () => contactsWithCompanyNames, 
        'Kişiler',
        formatContactsData
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
            />

            {/* Contact List Table */}
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <ContactList
                        contacts={paginatedContacts}
                        isLoading={loading}
                        error={error}
                        onContactDeleted={handleContactDeleted}
                    />
                    {/* Pagination */}
                    <ContactPagination
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
