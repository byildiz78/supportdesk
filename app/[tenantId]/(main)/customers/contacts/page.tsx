"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { useCustomersStore } from "@/stores/customers-store"
import { ContactList } from "./components/ContactList"
import { ContactHeader } from "./components/ContactHeader"
import { ContactFilters } from "./components/ContactFilters"
import { ContactPagination } from "./components/ContactPagination"

export default function ContactsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const { contacts, isLoading } = useCustomersStore()

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalContacts = filteredContacts.length
    const totalPages = Math.ceil(totalContacts / itemsPerPage)
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <ContactHeader />
            
            <ContactFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <ContactList 
                        contacts={paginatedContacts}
                        isLoading={isLoading}
                    />
                    
                    <ContactPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalContacts={totalContacts}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    )
}