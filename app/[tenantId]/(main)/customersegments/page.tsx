"use client"

import React, { useState } from 'react'
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'
import { Card } from '@/components/ui/card'

// Components
import { CustomerHeader } from './components/CustomerHeader'
import { CustomerSearchFilters } from './components/CustomerSearchFilters'
import { CustomerTable } from './components/CustomerTable'
import { CustomerPagination } from './components/CustomerPagination'

// Data
import { customers } from './data/mock-data'

export default function CustomerSegmentsPage() {
    const { selectedFilter } = useFilterStore()
    const { addTab, setActiveTab } = useTabStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    
    const handleNewCustomer = () => {
        const tabId = "Yeni Müşteri Segmenti";
        addTab({
            id: tabId,
            title: "Yeni Müşteri Segmenti",
            lazyComponent: () => import('./components/CreateCustomer').then(module => ({
                default: (props: any) => <module.default {...props} />
            }))
        });
        setActiveTab(tabId);
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.cardNo.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    const totalCustomers = filteredCustomers.length
    const totalPages = Math.ceil(totalCustomers / 10)
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * 10,
        currentPage * 10
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            {/* Header */}
            <CustomerHeader onNewCustomer={handleNewCustomer} />
            
            {/* Search and Filters */}
            <CustomerSearchFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            {/* Customer List Table */}
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    {/* Customer Table */}
                    <CustomerTable 
                        customers={paginatedCustomers}
                    />

                    {/* Pagination */}
                    <CustomerPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCustomers={totalCustomers}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    )
}