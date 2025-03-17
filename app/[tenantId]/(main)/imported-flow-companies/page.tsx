"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, ArrowLeft, Settings } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  city?: string;
  country?: string;
  is_active: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ImportedFlowCompaniesPage() {
  const params = useParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Fetch companies on initial load and when pagination changes
  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, searchTerm]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/supportdesk/api/main/companies/getFlowCompanies`,
        {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm
          }
        }
      );
      
      if (response.data && response.data.success) {
        setCompanies(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError("Veri formatı beklendiği gibi değil");
      }
    } catch (err) {
      setError("İçe aktarılan firmalar yüklenirken bir hata oluştu");
      console.error("Error fetching imported companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy HH:mm", { locale: tr });
    } catch (error) {
      return dateString;
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({
      ...prev,
      page: pageNumber
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({
      ...prev,
      page: 1 // Reset to first page on new search
    }));
  };

  // Extract Flow ID from notes
  const extractFlowId = (notes?: string): string => {
    if (!notes) return "-";
    
    const match = notes.match(/Flow ID: ([A-Za-z0-9]+)/);
    return match ? match[1] : "-";
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">İçe Aktarılan Flow Firmalar</h2>
        <div className="flex space-x-2">
          <Link href={`/${params?.tenantId || ''}/flow-companies`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Flow Firmalara Dön
            </Button>
          </Link>
          <Link href={`/${params?.tenantId || ''}/settings/flow-company-mapping`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Alan Eşleştirme Ayarları
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies">İçe Aktarılan Firmalar</TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Flow'dan İçe Aktarılan Firmalar</CardTitle>
              <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Firma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
                <Button type="submit" size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Yükleniyor...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center py-4 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="relative w-full overflow-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Firma Adı</TableHead>
                              <TableHead>Telefon</TableHead>
                              <TableHead>E-posta</TableHead>
                              <TableHead>Şehir</TableHead>
                              <TableHead>Ülke</TableHead>
                              <TableHead>Flow ID</TableHead>
                              <TableHead>Oluşturma Tarihi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {companies.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                  Firma bulunamadı
                                </TableCell>
                              </TableRow>
                            ) : (
                              companies.map((company) => (
                                <TableRow key={company.id}>
                                  <TableCell className="font-medium">{company.name}</TableCell>
                                  <TableCell>{company.phone || "-"}</TableCell>
                                  <TableCell>{company.email || "-"}</TableCell>
                                  <TableCell>{company.city || "-"}</TableCell>
                                  <TableCell>{company.country || "-"}</TableCell>
                                  <TableCell>{extractFlowId(company.notes)}</TableCell>
                                  <TableCell>{formatDate(company.created_at)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between space-x-2 py-4 mt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Toplam {pagination.total} kayıt | Sayfa {pagination.page}/{pagination.totalPages || 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages || loading}
                      >
                        Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
