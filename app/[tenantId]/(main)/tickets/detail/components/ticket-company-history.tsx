"use client"

import React, { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Card,
  CardContent
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Search,
  Calendar,
  Tag,
  MessageSquare,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { tr } from 'date-fns/locale'
import { useTicketStore } from '@/stores/ticket-store'
import { getStatusChange, getPriorityChange } from '@/lib/utils'
import { useTabStore } from '@/stores/tab-store'
import { formatInTimeZone } from 'date-fns-tz/formatInTimeZone'

// Define the ticket type based on the API response
interface CompanyTicket {
  id: string
  ticketno: string | number
  title: string
  description: string
  status: string
  priority: string
  source: string
  categoryId: string
  subcategoryId: string
  groupId: string
  assignedUserName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName: string
  dueDate: string
  slaBreach: boolean
  resolutionTime: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  callcount: number
  "Çözüm Süresi (dk)": number | null
  "Çözüm Notu": string | null
}

// Get status badge color
const getStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'open':
    case 'açık':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'closed':
    case 'kapalı':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'in_progress':
    case 'işlemde':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'waiting':
    case 'beklemede':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'pending':
    case 'onay bekliyor':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'resolved':
    case 'çözüldü':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
    case 'deleted':
    case 'silindi':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
  }
};

// Get priority badge color
const getPriorityColor = (priority: string | undefined): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'yüksek':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
    case 'orta':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'low':
    case 'düşük':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'urgent':
    case 'acil':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
};

const TicketCompanyHistory = ({ ticketId }: { ticketId: string }) => {
  const [tickets, setTickets] = useState<CompanyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc') // Default to newest first
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50) // Fixed at 50 items per page
  const [showCurrentTicket, setShowCurrentTicket] = useState(false) // Toggle to show/hide current ticket
  const { selectedTicket } = useTicketStore()
  const { activeTab, setActiveTab, addTab } = useTabStore()

  // Fetch company tickets
  useEffect(() => {
    const fetchCompanyTickets = async () => {
      if (!selectedTicket?.company_id) return

      try {
        setLoading(true)
        const response = await axios.post('/api/main/tickets/ticketCompanyHistory', {
          id: selectedTicket.company_id
        })
        setTickets(response.data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching company tickets:', err)
        setError(err.message || 'Firma biletleri yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyTickets()
  }, [selectedTicket?.company_id])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, showCurrentTicket])

  // Filter tickets based on search term and status
  const filteredTickets = tickets.filter(ticket => {
    // Filter out current ticket if showCurrentTicket is false
    if (!showCurrentTicket && ticket.id === ticketId) {
      return false
    }

    const matchesSearch =
      (ticket.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (String(ticket.ticketno || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort tickets by date
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    try {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      return sortDirection === 'desc'
        ? dateB - dateA // Newest first
        : dateA - dateB // Oldest first
    } catch (e) {
      return 0
    }
  })

  // Calculate pagination
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedTickets.slice(indexOfFirstItem, indexOfLastItem)

  // Page navigation
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)))
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(tickets.map(ticket => ticket.status)))

  // Check if a ticket is the current ticket
  const isCurrentTicket = (id: string) => id === ticketId

  const getDetails = (ticketId: string, ticketNo: string) => {
    const TabID = `ticket-${ticketNo}`;
    // Sekme zaten açık mı kontrol et
    const isTabAlreadyOpen = useTabStore.getState().tabs.some(tab => tab.id === TabID)

    if (!isTabAlreadyOpen) {
      addTab({
        id: TabID,
        title: `Talep #${ticketNo}`,
        lazyComponent: () => import('@/app/[tenantId]/(main)/tickets/detail/page').then(module => ({
          default: (props: any) => <module.default {...props} ticketId={ticketId} forceRefresh={true} />
        }))
      })
    } else {
      // Sekme zaten açıksa, önbelleği temizle
      try {
        const { clearTicketCache } = require('@/app/[tenantId]/(main)/tickets/detail/page');
        clearTicketCache(ticketId);
      } catch (error) {
        console.error("Önbellek temizleme hatası:", error);
      }
    }
    setActiveTab(TabID)
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Bilet ara..."
              className="pl-9 bg-white dark:bg-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-gray-800">
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{getStatusChange(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-white dark:bg-gray-800"
            onClick={toggleSortDirection}
            title={sortDirection === 'desc' ? 'En yeni ilk (şu anki sıralama)' : 'En eski ilk (şu anki sıralama)'}
          >
            <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'text-purple-500' : 'text-gray-500'}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 bg-white dark:bg-gray-800"
            onClick={() => setShowCurrentTicket(!showCurrentTicket)}
            title={showCurrentTicket ? 'Mevcut bileti gizle' : 'Mevcut bileti göster'}
          >
            <Eye className={`h-4 w-4 mr-2 ${showCurrentTicket ? 'text-purple-500' : 'text-gray-500'}`} />
            {showCurrentTicket ? 'Mevcut Bileti Gizle' : 'Mevcut Bileti Göster'}
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Firma biletleri yükleniyor...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sortedTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Bilet bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Arama kriterlerinize uygun bilet bulunamadı. Filtreleri değiştirmeyi deneyin.'
                : !showCurrentTicket && tickets.length === 1
                  ? 'Bu firma için başka bilet bulunmuyor. Mevcut bileti görmek için "Mevcut Bileti Göster" butonuna tıklayın.'
                  : 'Bu firma için henüz bilet oluşturulmamış.'}
            </p>
          </div>
        )}

        {/* Tickets table */}
        {!loading && !error && sortedTickets.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-[100px]">Bilet No</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Atanan</TableHead>
                  <TableHead className="cursor-pointer" onClick={toggleSortDirection}>
                    <div className="flex items-center">
                      Oluşturulma
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((ticket) => {
                  const isCurrent = isCurrentTicket(ticket.id);
                  return (
                    <TableRow
                      key={ticket.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/70 ${isCurrent
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500'
                          : 'bg-white dark:bg-gray-900/30'
                        }`}
                    >
                      <TableCell
                        className={`font-medium ${isCurrent
                            ? 'text-purple-700 dark:text-purple-300 flex items-center'
                            : 'text-purple-600 dark:text-purple-400 underline cursor-pointer hover:text-purple-800 dark:hover:text-purple-300'
                          }`}
                        onClick={isCurrent ? undefined : () => getDetails(ticket.id, String(ticket.ticketno))}
                      >
                        {isCurrent && (
                          <Badge variant="outline" className="mr-2 border-purple-500 text-purple-700 dark:text-purple-300">
                            Mevcut
                          </Badge>
                        )}
                        {ticket.ticketno}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={ticket.title}>
                        {ticket.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(ticket.status)} font-normal`}>
                          {getStatusChange(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(ticket.priority)} font-normal`}>
                          {getPriorityChange(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 dark:text-gray-300">{ticket.categoryId}</span>
                          {ticket.subcategoryId && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.subcategoryId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.assignedUserName || '-'}</TableCell>
                      <TableCell>
                        {formatInTimeZone(ticket.createdAt, 'Europe/Istanbul', 'dd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && sortedTickets.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Toplam {sortedTickets.length} bilet
              {sortedTickets.length !== tickets.length && ` (filtrelenmiş: toplam ${tickets.length})`}
              <span className="ml-2">
                {sortDirection === 'desc' ? '(En yeni ilk)' : '(En eski ilk)'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 bg-white dark:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm font-medium">
                Sayfa {currentPage} / {totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0 bg-white dark:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Page info */}
        {!loading && !error && sortedTickets.length > itemsPerPage && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            Gösterilen: {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedTickets.length)} / {sortedTickets.length}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TicketCompanyHistory