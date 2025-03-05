"use client"

import { useEffect, useState, useRef } from "react"
import { useFilterStore } from "@/stores/filters-store"
import { useTabStore } from '@/stores/tab-store'

// Bileşenler
import { CollectionHeader } from './components/CollectionHeader'
import { CollectionSearchFilters } from './components/CollectionSearchFilters'
import { CollectionTable } from './components/CollectionTable'
import { CollectionPagination } from './components/CollectionPagination'

// Veri
import { mockCollectionTransactions } from './data/mock-data'
import { useCollectionTransactionsStore } from "@/stores/main/collection-transactions-store"
import axios from "@/lib/axios"
import { toast } from "@/components/ui/toast/use-toast"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToExcel, formatBalanceData } from "@/lib/export-utils"

export default function CollectionTransactionsPage() {
    const { selectedFilter } = useFilterStore()
    const { activeTab } = useTabStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [isLoading, setIsLoading] = useState(false)
    const { collectionTransactions, setCollectionTransactions, selectedCollectionTransaction, setSelectedCollectionTransaction } = useCollectionTransactionsStore()
    const hasInitializedRef = useRef(false)
    const appliedAtRef = useRef(selectedFilter.appliedAt)
    
    // Verileri yükle
    const fetchCollectionData = async () => {
        try {
            setIsLoading(true)
            const latestFilter = useTabStore.getState().getTabFilter(activeTab)
            
            const response = await axios.post(
                "/api/main/collectiontransactions/collection_transactions_customers",
                {
                    date1: latestFilter?.date?.from,
                    date2: latestFilter?.date?.to,
                },
                {
                    headers: { "Content-Type": "application/json" },
                }
            )
            
            setCollectionTransactions(response.data)
        } catch (error) {
            console.error('Error fetching collection transactions:', error)
            
            // API'den 404 hatası geldiğinde (veri bulunamadı)
            if (error.response && error.response.status === 404) {
                toast({
                    title: "Bilgi",
                    description: "Seçilen tarih aralığında herhangi bir tahsilat işlemi bulunamadı. Lütfen farklı bir tarih aralığı seçin.",
                    variant: "default",
                })
            } else {
                // Diğer hatalar için
                toast({
                    title: "Hata!",
                    description: "Tahsilat işlemleri verilerini alırken bir sorun oluştu. Lütfen tekrar deneyin.",
                    variant: "destructive",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Component ilk mount olduğunda bir kez çalışır
    useEffect(() => {
        // Sadece bir kez çalışacak
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            
            // Aktif tab Tahsilat İşlemleri ise veri çek
            if (activeTab === "Tahsilat İşlemleri") {
                fetchCollectionData()
            }
        }
    }, []) // Boş dependency array ile sadece bir kez çalışır

    // Sadece filtre değişikliklerini izle
    useEffect(() => {
        // Filtre değişikliği kontrolü
        if (activeTab === "Tahsilat İşlemleri" && selectedFilter.appliedAt !== appliedAtRef.current) {
            appliedAtRef.current = selectedFilter.appliedAt
            fetchCollectionData()
        }
    }, [selectedFilter.appliedAt]) // Sadece appliedAt değiştiğinde çalışır

    // Verileri filtrele
    const filteredTransactions = collectionTransactions.filter(transaction => {
        const matchesSearch = 
            (transaction?.CustomerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (transaction?.SaleType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (transaction?.PaymentType?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    // Sayfalama
    const totalTransactions = filteredTransactions.length
    const totalPages = Math.ceil(totalTransactions / itemsPerPage)
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExportToExcel = () => {
        console.log(paginatedTransactions)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
                <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
                <CollectionHeader />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900 mr-3">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Tarih Aralığı</span>
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                {useTabStore.getState().getTabFilter(activeTab)?.date?.from
                                    ? new Date(useTabStore.getState().getTabFilter(activeTab).date.from).toLocaleDateString('tr-TR')
                                    : '-'} - {useTabStore.getState().getTabFilter(activeTab)?.date?.to
                                        ? new Date(useTabStore.getState().getTabFilter(activeTab).date.to).toLocaleDateString('tr-TR')
                                        : '-'}
                            </span>
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleExportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Excel'e Aktar
                    </Button>
                </div>
            </div>
            
            <CollectionSearchFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <div className="flex flex-col flex-1 overflow-hidden">
                <CollectionTable 
                    paginatedTransactions={paginatedTransactions}
                    filteredTransactions={filteredTransactions}
                    isLoading={isLoading}
                />
                
                <CollectionPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalTransactions={totalTransactions}
                    setCurrentPage={setCurrentPage}
                />
            </div>
        </div>
    )
}