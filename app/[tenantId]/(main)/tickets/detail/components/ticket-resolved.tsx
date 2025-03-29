import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, MessageSquare, Clock, User, Tag } from 'lucide-react'
import { TicketService } from '../services/ticket-service'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const TicketResolved = ({ ticketId }: { ticketId: string }) => {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        const response = await TicketService.getTicketById(ticketId)
        setTicket(response)
      } catch (error) {
        console.error('Bilet bilgileri alınamadı:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId])

  // Durum değişikliğini Türkçe olarak göster
  const getStatusChange = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Beklemede',
      'waiting': 'Beklemede',
      'in_progress': 'İşlemde',
      'resolved': 'Çözüldü',
      'closed': 'Kapatıldı',
    }
    return statusMap[status] || status
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-md"></div>
  }

  if (!ticket) {
    return <div className="text-sm text-gray-500">Bilet bilgileri bulunamadı</div>
  }

  const { status, resolution_notes, resolved_by, resolved_at, resolution_tags } = ticket

  return (
    <>
      {status === "resolved" && (
        <Card className="overflow-hidden shadow-sm border border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-800">
          {/* Top accent border for better design */}
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600 dark:from-red-700 dark:to-red-500"></div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Çözüm Detayları
                </h3>
              </div>
              <Badge
                className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {getStatusChange(status)}
              </Badge>
            </div>

            {resolved_at && (
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(resolved_at), { addSuffix: true, locale: tr })} çözümlendi
                </span>
              </div>
            )}

            {resolved_by && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>
                  Çözen: <span className="font-medium text-gray-700 dark:text-gray-300">{resolved_by}</span>
                </span>
              </div>
            )}

            <Separator className="my-4 bg-red-100 dark:bg-red-800/30" />

            {resolution_notes && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Çözüm Notları
                  </h4>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {resolution_notes}
                  </p>
                </div>
              </div>
            )}

            {resolution_tags && resolution_tags.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Çözüm Etiketleri
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resolution_tags.map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/30"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}

export default TicketResolved