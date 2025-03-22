"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Download, Filter, RefreshCw, CalendarDays, Settings } from "lucide-react";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useTabStore } from "@/stores/tab-store";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useFlowFields } from "@/providers/flow-field-provider";
import { toast } from "@/components/ui/toast/use-toast";

interface FlowCompany {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
  isImported?: boolean;
  [key: string]: any;
}

interface CustomField {
  type: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isImmutable: boolean;
  isMultiple: boolean;
  isDynamic: boolean;
  title: string;
  listLabel: string;
  formLabel: string;
  filterLabel: string;
  settings: any;
}

interface CustomFields {
  [key: string]: CustomField;
}

interface MappingItem {
  sourceField: string;
  targetField: string;
  description: string;
}

interface MappingData {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  mappings: MappingItem[];
}

export default function FlowCompaniesPage() {
  const [allCompanies, setAllCompanies] = useState<FlowCompany[]>([]);
  const [displayCompanies, setDisplayCompanies] = useState<FlowCompany[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const { customFields, loading: fieldsLoading, fetchFields } = useFlowFields();
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const { addTab, setActiveTab, tabs, activeTab } = useTabStore();
  const [filterStatus, setFilterStatus] = useState<"all" | "imported" | "not-imported">("all");
  const [dateFilter, setDateFilter] = useState<"last-week" | "all">("last-week");
  const [mappingData, setMappingData] = useState<MappingData | null>(null);

  // Önce mapping bilgisini yükle
  useEffect(() => {
    fetchMappingData();
  }, []);

  // Sonra custom fields'leri yükle
  useEffect(() => {
    if (mappingData) {
      initializeFields();
    }
  }, [mappingData]);

  // Sonra şirketleri yükle
  useEffect(() => {
    if (Object.keys(customFields).length > 0 && selectedFields.length > 0) {
      fetchCompanies();
    }
  }, [customFields, selectedFields]);

  // Handle pagination, search, and status filtering
  useEffect(() => {
    if (allCompanies.length > 0) {
      // Apply search filter
      let filtered = searchTerm
        ? allCompanies.filter(company =>
          company.TITLE.toLowerCase().includes(searchTerm.toLowerCase()))
        : allCompanies;

      // Apply status filter
      if (filterStatus === "imported") {
        filtered = filtered.filter(company => company.isImported === true);
      } else if (filterStatus === "not-imported") {
        filtered = filtered.filter(company => company.isImported !== true);
      }

      // Set total record count
      setTotalRecords(filtered.length);

      // Reset to first page when filters change
      if (currentPage !== 1 && (searchTerm || filterStatus !== "all")) {
        setCurrentPage(1);
      }

      // Paginate the filtered results
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setDisplayCompanies(filtered.slice(startIndex, endIndex));

      // Clear selections if they're not in the current filter
      const validSelections = selectedCompanies.filter(id =>
        filtered.some(company => company.ID === id)
      );
      if (validSelections.length !== selectedCompanies.length) {
        setSelectedCompanies(validSelections);
      }
    }
  }, [allCompanies, searchTerm, currentPage, pageSize, filterStatus]);

  // Set initial visible columns when custom fields are loaded
  useEffect(() => {
    if (Object.keys(customFields).length > 0) {
      // Default visible columns - Limit to fewer columns for better responsiveness
      const defaultVisibleColumns = ["ID", "TITLE", "PHONE", "EMAIL", "DATE_CREATE"];

      // Add only 1 important UF_CRM field to start with
      const ufCrmFields = Object.keys(customFields)
        .filter(key => key.startsWith("UF_CRM"))
        .slice(0, 1);

      setVisibleColumns([...defaultVisibleColumns, ...ufCrmFields]);
    }
  }, [customFields]);

  // Eşleştirme ayarlarını yükle
  const fetchMappingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/flow-companies/getFlowCompanyMapping`);
      
      if (response.data && response.data.success && response.data.mapping) {
        setMappingData(response.data.mapping);
      } else {
        setError("Eşleştirme ayarları yüklenemedi");
      }
    } catch (err) {
      setError("Eşleştirme ayarları yüklenirken bir hata oluştu");
      console.error("Error fetching mapping data:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeFields = async () => {
    try {
      setLoading(true);
      
      // Provider'da otomatik olarak yükleniyor, sadece customFields boşsa çağır
      if (Object.keys(customFields).length === 0) {
        await fetchFields();
      }

      // Temel alanları ve özel alanları birleştir
      const standardFields = ["ID", "TITLE", "ASSIGNED_BY_ID", "DATE_CREATE", "ADDRESS", "ADDRESS_CITY", "ADDRESS_COUNTRY", "PHONE", "EMAIL"];
      const ufCrmFields = Object.keys(customFields).filter(key => key.startsWith("UF_CRM"));
      
      // Mapping'den sourceField'ları al - böylece COMPANY_TYPE gibi alanlar da dahil olur
      let allSourceFields = [...standardFields, ...ufCrmFields];
      
      if (mappingData && mappingData.mappings) {
        // Mapping'de tanımlı tüm source alanlarını ekle
        const mappingSourceFields = mappingData.mappings
          .map(item => item.sourceField)
          .filter(field => field !== null && field !== undefined);
        
        // Tüm alanları birleştir ve tekrar edenleri kaldır
        allSourceFields = [...new Set([...allSourceFields, ...mappingSourceFields])];
      }

      setSelectedFields(allSourceFields);
    } catch (err) {
      setError("Özel alanlar yüklenirken bir hata oluştu");
      console.error("Error initializing fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter: "last-week" | "all") => {
    // Only update if the filter is actually changing
    if (filter !== dateFilter) {
      setDateFilter(filter);
      setCurrentPage(1);
      
      // Directly pass the new filter value to a modified fetch function
      fetchCompaniesWithFilter(filter);
    }
  };

  const fetchCompaniesWithFilter = async (filterValue: "last-week" | "all") => {
    try {
      setLoading(true);
      setError(null);

      // İlk yüklemede veya son bir hafta butonu tıklandığında tarih filtresi ekle
      const requestData: any = {
        select: selectedFields,
        order: { DATE_CREATE: "DESC" }
      };

      // Son bir hafta tarih filtresi eklenirse
      if (filterValue === "last-week") {
        const oneWeekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ssxxx");
        requestData.filter = {
          ">=DATE_MODIFY": oneWeekAgo
        };
      }

      const response = await axios.post(
        `/api/flow-companies`,
        requestData
      );

      if (response.data && response.data.result) {
        setAllCompanies(response.data.result);
        setTotalRecords(response.data.result.length);

        // Initialize first page
        const firstPageData = response.data.result.slice(0, pageSize);
        setDisplayCompanies(firstPageData);
        setCurrentPage(1);

        // Clear selections
        setSelectedCompanies([]);

        toast({
          title: "Başarılı",
          description: `${response.data.result.length} firma başarıyla yüklendi.`,
        });
      } else {
        setError("Veri formatı beklendiği gibi değil");
      }
    } catch (err) {
      setError("Firmalar yüklenirken bir hata oluştu");
      console.error("Error fetching companies:", err);

      toast({
        title: "Hata",
        description: "Firmalar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    fetchCompaniesWithFilter(dateFilter);
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
    setCurrentPage(pageNumber);
  };

  // Format field value based on its type (Enhanced version)
  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.VALUE || JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      if (value.VALUE !== undefined) {
        return String(value.VALUE);
      }
      return JSON.stringify(value);
    }

    if (field === "DATE_CREATE") {
      return formatDate(value);
    }

    if (customFields[field]) {
      const fieldType = customFields[field].type;

      if (fieldType === "date" || fieldType === "datetime") {
        return formatDate(value);
      }

      if (fieldType === "boolean") {
        return value === "Y" ? "Evet" : "Hayır";
      }

      if (fieldType === "enumeration" && Array.isArray(customFields[field].settings?.items)) {
        const item = customFields[field].settings.items.find((item: any) => item.ID === value);
        return item ? String(item.VALUE) : String(value);
      }
    }

    return String(value);
  };

  // Get all available columns
  const allColumns = useMemo(() => {
    const standardColumns = [
      { field: "ID", title: "ID", listLabel: "ID", width: "60px" },
      { field: "TITLE", title: "Firma Adı", listLabel: "Firma Adı", width: "200px" },
      { field: "PHONE", title: "Telefon", listLabel: "Telefon", width: "120px" },
      { field: "EMAIL", title: "E-posta", listLabel: "E-posta", width: "200px" },
      { field: "DATE_CREATE", title: "Oluşturma Tarihi", listLabel: "Oluşturma Tarihi", width: "150px" },
      { field: "ADDRESS", title: "Adres", listLabel: "Adres", width: "200px" },
      { field: "ADDRESS_CITY", title: "Şehir", listLabel: "Şehir", width: "120px" },
      { field: "ADDRESS_COUNTRY", title: "Ülke", listLabel: "Ülke", width: "120px" },
      { field: "COMPANY_TYPE", title: "Firma Tipi", listLabel: "Firma Tipi", width: "120px" },
    ];

    const customColumns = Object.entries(customFields)
      .filter(([key]) => key.startsWith("UF_CRM"))
      .map(([key, field]) => ({
        field: key,
        title: field.title || key,
        listLabel: field.listLabel || field.title || key,
        width: "150px" // Default width for custom fields
      }));

    return [...standardColumns, ...customColumns];
  }, [customFields]);

  // Get only visible columns
  const displayColumns = useMemo(() => {
    return allColumns.filter(column => visibleColumns.includes(column.field));
  }, [allColumns, visibleColumns]);

  // Toggle column visibility
  const toggleColumnVisibility = (field: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Filtrelenmiş ve içe aktarılmamış şirketleri getiren yardımcı fonksiyon
  const getFilteredNotImportedCompanies = () => {
    // Tüm filtrelenmiş şirketleri al
    let filtered = searchTerm
      ? allCompanies.filter(company =>
        company.TITLE.toLowerCase().includes(searchTerm.toLowerCase()))
      : allCompanies;

    // Durum filtresini uygula
    if (filterStatus === "imported") {
      filtered = filtered.filter(company => company.isImported === true);
    } else if (filterStatus === "not-imported") {
      filtered = filtered.filter(company => company.isImported !== true);
    }

    // İçe aktarılmamış şirketleri filtrele
    return filtered.filter(company => !company.isImported);
  };

  // Handle select all checkboxes
  const handleSelectAll = () => {
    const notImportedCompanies = getFilteredNotImportedCompanies();

    // Tüm içe aktarılmamış şirketlerin ID'leri
    const allNotImportedIds = notImportedCompanies.map(company => company.ID);

    // Eğer tüm içe aktarılmamış şirketler zaten seçiliyse, seçimi temizle
    // Aksi takdirde tüm içe aktarılmamış şirketleri seç
    if (selectedCompanies.length === allNotImportedIds.length &&
      allNotImportedIds.every(id => selectedCompanies.includes(id))) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(allNotImportedIds);
    }
  };

  // Handle individual checkbox selection
  const handleSelectCompany = (id: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(id)) {
        return prev.filter(companyId => companyId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Clear search and reset pagination
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Toggle status filter
  const handleFilterStatus = (status: "all" | "imported" | "not-imported") => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    let pages = [];

    // Add first page
    pages.push(1);

    // Add current page and adjacent pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    // Sort pages
    pages.sort((a, b) => a - b);

    return pages;
  };

  const handleNewFlowField = () => {
    const tabId = "Alan Eşleştirme Ayarları";
    // Sekme zaten açık mı kontrol et
    const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId);

    if (!isTabAlreadyOpen) {
      addTab({
        id: tabId,
        title: "Alan Eşleştirme Ayarları",
        lazyComponent: () => import('@/app/[tenantId]/(main)/flow-company-mapping/page').then(module => ({
          default: (props: any) => <module.default {...props} />
        }))
      });
    }
    setActiveTab(tabId);
  };

  const handleFlowCustomer = () => {
    const tabId = "İçe Aktarılan Firmalar";
    const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId);

    if (!isTabAlreadyOpen) {
      addTab({
        id: tabId,
        title: "İçe Aktarılan Firmalar",
        lazyComponent: () => import('@/app/[tenantId]/(main)/imported-flow-companies/page').then(module => ({
          default: (props: any) => <module.default {...props} />
        }))
      });
    }
    setActiveTab(tabId);
  };

  const handleImportSelectedCompanies = async () => {
    try {
      if (selectedCompanies.length === 0) {
        toast({
          title: "Hata",
          description: "Lütfen içe aktarılacak firmaları seçin.",
          variant: "destructive"
        });
        return;
      }

      setImportLoading(true);

      // Seçili firmaları al
      const selectedCompanyData = allCompanies.filter(company =>
        selectedCompanies.includes(company.ID)
      );

      // Mapping'in güncel olduğundan emin olmak için tekrar yükle
      let mappingToUse = mappingData;
      if (!mappingToUse) {
        const mappingResponse = await axios.get(`/api/flow-companies/getFlowCompanyMapping`);
        if (!mappingResponse.data || !mappingResponse.data.success || !mappingResponse.data.mapping) {
          toast({
            title: "Hata",
            description: "Eşleştirme ayarları bulunamadı. Lütfen önce alan eşleştirme ayarlarını yapılandırın.",
            variant: "destructive"
          });
          setImportLoading(false);
          return;
        }
        mappingToUse = mappingResponse.data.mapping;
      }

      // Şirketleri daha küçük gruplara böl (her grupta maksimum 50 şirket olacak şekilde)
      const batchSize = 100;
      const batches = Math.ceil(selectedCompanyData.length / batchSize);
      
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      // Her bir grup için işlem yap
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, selectedCompanyData.length);
        const currentBatch = selectedCompanyData.slice(batchStart, batchEnd);
        
        try {
          // İçe aktarma işlemini başlat (sadece mevcut grup için)
          const response = await axios.post(`/api/flow-companies/import-selected`, {
            companies: currentBatch,
            mapping: mappingToUse
          });

          if (response.data && response.data.success) {
            // Başarılı sonuçları topla
            totalInserted += response.data.inserted || 0;
            totalUpdated += response.data.updated || 0;
            totalFailed += response.data.failed || 0;
            
            // Hataları topla
            if (response.data.errors && Array.isArray(response.data.errors)) {
              allErrors.push(...response.data.errors);
            }
          } else {
            // Başarısız grup
            totalFailed += currentBatch.length;
            allErrors.push(`Grup ${batchIndex + 1} işlenirken hata: ${response.data?.message || "Bilinmeyen hata"}`);
          }
        } catch (err) {
          console.error(`Error in batch ${batchIndex + 1}:`, err);
          totalFailed += currentBatch.length;
          allErrors.push(`Grup ${batchIndex + 1} işlenirken hata: ${(err as Error).message}`);
        }
        
        // Kullanıcıya ilerleme hakkında bilgi ver
        if (batches > 1) {
          toast({
            title: "İşleniyor",
            description: `Grup ${batchIndex + 1}/${batches} işlendi.`,
          });
        }
      }

      // İşlem tamamlandığında sonuç bilgisi göster
      if (totalInserted > 0 || totalUpdated > 0) {
        toast({
          title: "Başarılı",
          description: `${totalInserted} firma eklendi, ${totalUpdated} firma güncellendi.${
            totalFailed > 0 ? ` ${totalFailed} firma işlenemedi.` : ''
          }`
        });
        
        // Clear selections
        setSelectedCompanies([]);
        
      } else if (totalFailed > 0) {
        toast({
          title: "Hata",
          description: `Hiçbir firma içe aktarılamadı. ${totalFailed} firma işlenemedi.`,
          variant: "destructive"
        });
      }
      
      // Eğer hatalar varsa, konsola yazdır
      if (allErrors.length > 0) {
        console.error("Import errors:", allErrors);
      }
    } catch (err) {
      console.error("Error importing companies:", err);
      toast({
        title: "Hata",
        description: "Firmalar içe aktarılırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Count of imported and not imported companies
  const importedCount = useMemo(() =>
    allCompanies.filter(company => company.isImported).length,
    [allCompanies]
  );

  const notImportedCount = useMemo(() =>
    allCompanies.filter(company => !company.isImported).length,
    [allCompanies]
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Flow Firmaları</h2>
        <div className="flex items-center">
          <Button
            variant="default"
            size="sm"
            onClick={handleImportSelectedCompanies}
            disabled={selectedCompanies.length === 0 || importLoading}
            className="ml-4"
          >
            {importLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {selectedCompanies.length > 0
              ? `${selectedCompanies.length} Firmayı İçe Aktar`
              : 'Firmaları İçe Aktar'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="ml-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Araçlar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNewFlowField}>
                Alan Eşleştirme Ayarları
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFlowCustomer}>
                İçe Aktarılan Firmalar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="border-0 shadow-md bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-lg">
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
            <div className="flex items-center">
              <CardTitle>
                Flow Firma Listesi
              </CardTitle>

              <div className="ml-4 flex rounded-md overflow-hidden border">
                <Button
                  variant={dateFilter === "last-week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDateFilterChange("last-week")}
                  className="rounded-none px-3 py-1 h-8"
                  disabled={loading}
                >
                  Son 1 Hafta
                </Button>
                <Button
                  variant={dateFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDateFilterChange("all")}
                  className="rounded-none px-3 py-1 h-8"
                  disabled={loading}
                >
                  Tüm Liste
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Filter className="h-3 w-3 mr-1" /> Filtre
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleFilterStatus("all")}>
                      Tümü ({allCompanies.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterStatus("imported")}>
                      İçe Aktarılan ({importedCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterStatus("not-imported")}>
                      Aktarılmayan ({notImportedCount})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Filter className="h-3 w-3 mr-1" /> Kolonlar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Görünür Kolonlar</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[300px] overflow-y-auto">
                      {allColumns.map((column) => (
                        <DropdownMenuItem key={column.field} onSelect={(e) => e.preventDefault()}>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={visibleColumns.includes(column.field)}
                              onCheckedChange={() => toggleColumnVisibility(column.field)}
                              id={`column-${column.field}`}
                            />
                            <label
                              htmlFor={`column-${column.field}`}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              {column.title}
                            </label>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={fetchCompanies} disabled={loading} className="h-8 px-2">
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yenile
                </Button>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Firma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={handleClearSearch}
                  >
                    &times;
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex justify-center items-center py-8 flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center py-4 text-red-500 flex-1">{error}</div>
            ) : (
              <>
                {/* Filtre ve durum bilgisi */}
                <div className="p-2 px-4 bg-muted/20 text-sm text-muted-foreground flex justify-between items-center">
                  <div>
                    {filterStatus === "all" ? "Tüm firmalar" :
                      filterStatus === "imported" ? "İçe aktarılan firmalar" :
                        "Aktarılmayan firmalar"}
                    {dateFilter === "last-week" && (
                      <Badge variant="outline" className="ml-2 text-sm">
                        Son 1 Hafta
                      </Badge>
                    )}
                  </div>
                  <div>
                    Toplam: <span className="font-medium">{totalRecords}</span> firma |
                    Seçili: <span className="font-medium">{selectedCompanies.length}</span>
                    {filterStatus !== "imported" && (
                      <> / <span className="font-medium">{getFilteredNotImportedCompanies().length}</span> aktarılabilir</>
                    )}
                  </div>
                </div>

                {/* Fixed width wrapper that doesn't expand with table */}
                <div className="w-full overflow-hidden flex-1">
                  {/* Container with both horizontal and vertical scrolling */}
                  <div className="overflow-auto h-[400px]">
                    {/* Table with fixed layout to prevent column expansion */}
                    <table className="w-full border-collapse table-fixed">
                      <thead className="bg-muted/30 sticky top-0 z-10 bg-white">
                        <tr>
                          <th className="w-12 p-3 sticky left-0 bg-muted/50 z-20 text-center">
                            <Checkbox
                              checked={
                                selectedCompanies.length > 0 &&
                                (() => {
                                  const notImportedCompanies = getFilteredNotImportedCompanies();
                                  const allNotImportedIds = notImportedCompanies.map(company => company.ID);
                                  return allNotImportedIds.length > 0 &&
                                    selectedCompanies.length === allNotImportedIds.length &&
                                    allNotImportedIds.every(id => selectedCompanies.includes(id));
                                })()
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all"
                              disabled={(() => {
                                const notImportedCompanies = getFilteredNotImportedCompanies();
                                return notImportedCompanies.length === 0;
                              })()}
                            />
                          </th>
                          {displayColumns.map((column, index) => (
                            <th
                              key={column.field}
                              className={`p-3 text-center border-b ${index === 0 ? "sticky left-12 bg-muted/50 z-20" : ""
                                } ${column.field === "ID" ? "text-center font-mono text-xs" :
                                  column.field === "TITLE" ? "font-medium" :
                                    column.field === "DATE_CREATE" ? "text-center text-muted-foreground text-sm" :
                                      "text-center"
                                }`}
                              style={{
                                width: column.width,
                                minWidth: column.width,
                                maxWidth: column.width,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <div className="font-medium">
                                {column.title}
                              </div>
                            </th>
                          ))}
                          <th className="w-12 p-3 text-center border-b">
                            <span className="sr-only">Eylemler</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={displayColumns.length + 2} className="p-4 text-center border-b">
                              <div className="flex flex-col items-center justify-center text-muted-foreground py-10">
                                <Search className="h-10 w-10 mb-2 opacity-20" />
                                <p className="font-medium">Veri bulunamadı</p>
                                <p className="text-sm mt-1">Arama kriterlerinizi değiştirerek tekrar deneyin</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayCompanies.map((company) => (
                            <tr
                              key={company.ID}
                              className={`border-b hover:bg-muted/30 transition-colors ${selectedCompanies.includes(company.ID)
                                  ? "bg-muted/30"
                                  : company.isImported
                                    ? "bg-green-50 dark:bg-green-900/20"
                                    : ""
                                }`}
                            >
                              <td className="p-3 sticky left-0 bg-white dark:bg-gray-900 z-20 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <Checkbox
                                    checked={selectedCompanies.includes(company.ID)}
                                    onCheckedChange={() => handleSelectCompany(company.ID)}
                                    aria-label={`Select ${company.TITLE}`}
                                    disabled={company.isImported}
                                  />
                                  {company.isImported && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800 text-xs mt-1 px-1 py-0">
                                      İçe Aktarıldı
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              {displayColumns.map((column, index) => (
                                <td
                                  key={`${company.ID}-${column.field}`}
                                  className={`p-3 border-b ${index === 0 ? "sticky left-12 bg-white dark:bg-gray-900 z-20" : ""
                                    } ${column.field === "ID" ? "text-center font-mono text-xs" :
                                      column.field === "TITLE" ? "font-medium" :
                                        column.field === "DATE_CREATE" ? "text-center text-muted-foreground text-sm" :
                                          "text-center"
                                    } ${company.isImported ? "bg-green-50 dark:bg-green-900/20" : ""
                                    }`}
                                  style={{
                                    width: column.width,
                                    minWidth: column.width,
                                    maxWidth: column.width,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {formatFieldValue(column.field, company[column.field])}
                                </td>
                              ))}
                              <td className="p-3 text-center border-b">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Eylemler</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Görüntüle</DropdownMenuItem>
                                    <DropdownMenuItem>Düzenle</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">Sil</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manual Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Sayfa {currentPage}/{Math.ceil(totalRecords / pageSize) || 1}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPaginationNumbers().map(pageNum => (
                        <Button
                          key={`page-${pageNum}`}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalRecords / pageSize) || loading}
                      className="h-8 px-3"
                    >
                      Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}