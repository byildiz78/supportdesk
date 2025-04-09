'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/lib/axios';
import { useTabStore } from '@/stores/tab-store';
import { clearTicketCache } from '../tickets/detail/page';

interface Ticket {
  id: string;
  ticketno: number;
  title: string;
  status: string;
  priority: string;
  customer_name: string | null;
  company_name: string | null;
  assigned_user_name: string | null;
  created_at: string;
  updated_at: string | null;
  ticket_created_by_name: string | null;
  category_name: string | null;
  subcategory_name: string | null;
}

interface SearchPageProps {
  searchTerm?: string;
  key?: string | number;
}

const TicketSearch = ({ searchTerm: initialSearchTerm, key }: SearchPageProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const tenantId = params?.tenantId || '';
  const { addTab, setActiveTab } = useTabStore()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const termFromUrl = searchParams.get('term');
    
    if (termFromUrl) {
      setSearchTerm(termFromUrl);
      performSearch(termFromUrl);
    }
  }, []);

  useEffect(() => {
    if (initialSearchTerm) {
      performSearch(initialSearchTerm);
    }
  }, [initialSearchTerm, key]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: tr });
    } catch (error) {
      return dateString;
    }
  };

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      toast({
        title: "Arama terimi gerekli",
        description: "Lütfen bir arama terimi girin",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setTickets([]);

    try {
      const response = await axios.get(`/api/main/search?searchTerm=${encodeURIComponent(term)}`);
      const data = response.data;

      if (data.success) {
        setTickets(data.data);
        if (data.data.length === 0) {
          toast({
            title: "Sonuç bulunamadı",
            description: "Aramanızla eşleşen bilet bulunamadı",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Arama hatası",
          description: data.message || "Biletler aranırken bir hata oluştu",
          variant: "destructive"
        });
        setTickets([]);
      }
    } catch (error) {
      console.error("Arama hatası:", error);
      toast({
        title: "Arama hatası",
        description: "Biletler aranırken bir hata oluştu",
        variant: "destructive"
      });
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "yüksek":
        return "bg-red-500";
      case "medium":
      case "orta":
        return "bg-yellow-500";
      case "low":
      case "düşük":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "açık":
        return "bg-blue-500";
      case "in_progress":
      case "işlemde":
        return "bg-yellow-500";
      case "resolved":
      case "çözüldü":
        return "bg-green-500";
      case "closed":
      case "kapatıldı":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "Açık";
      case "in_progress":
        return "İşlemde";
      case "resolved":
        return "Çözüldü";
      case "closed":
        return "Kapatıldı";
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  const handleRowClick = (ticket: Ticket) => {
    const tabId = `ticket-${ticket.id}`
  
    // Önce bu ID'ye sahip bir tab var mı kontrol et
    const tabs = useTabStore.getState().tabs
    const existingTab = tabs.find(tab => tab.id === tabId)
  
    // Her tıklamada önbelleği temizle, böylece her zaman API'den taze veri alınacak
    clearTicketCache(tabId)
  
    if (existingTab) {
      // Tab zaten açıksa, sadece o taba geçiş yap
      setActiveTab(tabId)
    } else {
      // Tab yoksa yeni tab oluştur
      addTab({
        id: tabId,
        title: `Talep #${ticket.ticketno}`,
        lazyComponent: () => import('../tickets/detail/page').then(module => ({
          default: (props: any) => <module.default {...props} ticketId={ticket.id} />
        }))
      })
      setActiveTab(tabId)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Bilet Arama</CardTitle>
          <CardDescription>
            Bilet numarası, başlık, müşteri adı, şirket adı veya diğer bilgilere göre arama yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <form onSubmit={handleSearch} className="flex gap-2 mb-6 flex-shrink-0">
            <Input
              placeholder="Arama terimi girin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Skeleton className="h-4 w-4 rounded-full" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Ara
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-2 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : hasSearched ? (
            tickets.length > 0 ? (
              <div className="rounded-md border">
                <div className="h-[calc(65vh-4rem)] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-900/50 z-10">
                      <TableRow>
                        <TableHead>Bilet No</TableHead>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Öncelik</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Alt Kategori</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Şirket</TableHead>
                        <TableHead>Atanan</TableHead>
                        <TableHead>Oluşturulma Tarihi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow 
                          key={ticket.id} 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleRowClick(ticket)}
                        >
                          <TableCell className="font-medium">#{ticket.ticketno}</TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusText(ticket.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {getPriorityText(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.category_name || '-'}</TableCell>
                          <TableCell>{ticket.subcategory_name || '-'}</TableCell>
                          <TableCell>{ticket.customer_name || '-'}</TableCell>
                          <TableCell>{ticket.company_name || '-'}</TableCell>
                          <TableCell>{ticket.assigned_user_name || '-'}</TableCell>
                          <TableCell>{formatDate(ticket.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aramanızla eşleşen bilet bulunamadı.
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              Arama yapmak için yukarıdaki formu kullanın.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSearch;