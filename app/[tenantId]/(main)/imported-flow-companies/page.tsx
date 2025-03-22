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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useTabStore } from "@/stores/tab-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Flow API'den gelen şirket verisi için arayüz
interface FlowCompany {
  ID: string;
  TITLE: string;
  COMPANY_TYPE?: string;
  HAS_PHONE?: string;
  HAS_EMAIL?: string;
  ADDRESS_CITY?: string;
  ADDRESS_COUNTRY?: string;
  DATE_CREATE: string;
  [key: string]: any; // Diğer alanlar için
}

// Uygulamamızda kullanacağımız şirket verisi için arayüz
interface Company {
  id: string;
  parentCompanyId: string | null;
  name: string;
  taxId: string | null;
  taxOffice: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  companyType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | Date;
  createdBy: string | null;
  updatedAt: string | Date;
  updatedBy: string | null;
  isDeleted: boolean;
  flow_ba_starting_date: string | null;
  flow_ba_end_date: string | null;
  flow_ba_notes: string | null;
  flow_support_notes: string | null;
  flow_licence_notes: string | null;
  flow_id: number;
  flow_last_update_date: string | null;
}

export default function ImportedFlowCompaniesPage() {
  const params = useParams();
  const { removeTab: removeTabFromStore, setActiveTab: setActiveTabFromStore } = useTabStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [displayedCompanies, setDisplayedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `/api/main/companies/companiesList`
      );
      
      if (response.data) {
        // API artık doğrudan veriyi döndürüyor, result içinde değil
        const companiesData = Array.isArray(response.data) ? response.data : [];
        setAllCompanies(companiesData);
        
        // İlk filtrelemeyi yap
        filterCompanies(companiesData, searchTerm);
      } else {
        setError("Veri formatı beklendiği gibi değil");
        console.error("Unexpected data format:", response.data);
      }
    } catch (err) {
      setError("İçe aktarılan firmalar yüklenirken bir hata oluştu");
      console.error("Error fetching imported companies:", err);
    } finally {
      setLoading(false);
    }
  };

  // Arama terimine göre şirketleri filtrele
  const filterCompanies = (companies: Company[], term: string) => {
    if (!term.trim()) {
      setFilteredCompanies(companies);
      
      // Toplam sayfa sayısını hesapla
      const totalPages = Math.ceil(companies.length / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: companies.length,
        totalPages,
        page: 1 // Filtreleme değiştiğinde ilk sayfaya dön
      }));
      
      // İlk sayfayı göster
      updateDisplayedCompanies(companies, 1, pagination.limit);
    } else {
      const lowercaseTerm = term.toLowerCase();
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(lowercaseTerm) ||
        (company.phone && company.phone.toLowerCase().includes(lowercaseTerm)) ||
        (company.email && company.email.toLowerCase().includes(lowercaseTerm)) ||
        (company.city && company.city.toLowerCase().includes(lowercaseTerm)) ||
        (company.country && company.country.toLowerCase().includes(lowercaseTerm)) ||
        (company.taxId && company.taxId.toLowerCase().includes(lowercaseTerm)) ||
        String(company.flow_id).includes(lowercaseTerm)
      );
      
      setFilteredCompanies(filtered);
      
      // Toplam sayfa sayısını hesapla
      const totalPages = Math.ceil(filtered.length / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: filtered.length,
        totalPages,
        page: 1 // Filtreleme değiştiğinde ilk sayfaya dön
      }));
      
      // İlk sayfayı göster
      updateDisplayedCompanies(filtered, 1, pagination.limit);
    }
  };
  
  // Belirli bir sayfadaki şirketleri göster
  const updateDisplayedCompanies = (companies: Company[], page: number, limit: number) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    setDisplayedCompanies(companies.slice(startIndex, endIndex));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);
  
  useEffect(() => {
    if (allCompanies.length > 0) {
      filterCompanies(allCompanies, searchTerm);
    }
  }, [searchTerm]);
  
  useEffect(() => {
    if (filteredCompanies.length > 0) {
      updateDisplayedCompanies(filteredCompanies, pagination.page, pagination.limit);
    }
  }, [pagination.page, pagination.limit]);

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, "dd MMM yyyy HH:mm", { locale: tr });
    } catch (error) {
      return String(date);
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
    filterCompanies(allCompanies, searchTerm);
  };

  const removeTab = () => {
    const tabId = "İçe Aktarılan Firmalar";
    removeTabFromStore(tabId);
    setActiveTabFromStore('Flow Firmaları');
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">İçe Aktarılan Flow Firmalar</h2>
          <p className="text-muted-foreground mt-1">Flow'dan içe aktarılan firmaları görüntüleyin ve yönetin</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={removeTab} className="transition-all hover:bg-primary hover:text-primary-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Flow Firmalara Dön
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Toplam {pagination.total} kayıt | Sayfa {pagination.page}/{pagination.totalPages || 1}
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <Input
            placeholder="Firma ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 min-w-[200px] bg-background"
          />
          <Button type="submit" size="sm" variant="default" className="h-9 px-4">
            <Search className="h-4 w-4 mr-2" />
            Ara
          </Button>
        </form>
      </div>

      <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 flex-1">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <span className="text-muted-foreground">Firmalar yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 flex-1">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-2">
                <p className="font-medium">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">Lütfen daha sonra tekrar deneyin veya yöneticinize başvurun.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto flex-1 h-[400px]">
                <Table className="border-collapse">
                  <TableHeader className="sticky top-0 z-10 bg-muted/30">
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Firma Adı</TableHead>
                      <TableHead className="font-semibold">Telefon</TableHead>
                      <TableHead className="font-semibold">E-posta</TableHead>
                      <TableHead className="font-semibold">Şehir</TableHead>
                      <TableHead className="font-semibold">Ülke</TableHead>
                      <TableHead className="font-semibold">Vergi No</TableHead>
                      <TableHead className="font-semibold">Flow ID</TableHead>
                      <TableHead className="font-semibold">Oluşturma Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Search className="h-10 w-10 mb-2 opacity-20" />
                            <p className="font-medium">Firma bulunamadı</p>
                            <p className="text-sm mt-1">Arama kriterlerinizi değiştirerek tekrar deneyin</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedCompanies.map((company) => (
                        <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.phone || "-"}</TableCell>
                          <TableCell>{company.email || "-"}</TableCell>
                          <TableCell>{company.city || "-"}</TableCell>
                          <TableCell>{company.country || "-"}</TableCell>
                          <TableCell>{company.taxId || "-"}</TableCell>
                          <TableCell>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                              {company.flow_id || "-"}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(company.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{pagination.total}</span> kayıttan 
                  <span className="font-medium"> {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> arası gösteriliyor
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Sayfa numaralarını hesapla
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={i}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="h-8 px-3"
                  >
                    Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}