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
import { Search, ChevronLeft, ChevronRight, Loader2, Download, Check, List, Settings } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface FlowCompany {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
  [key: string]: any; // For custom fields
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

export default function FlowCompaniesPage() {
  const router = useRouter();
  const params = useParams();
  const [companies, setCompanies] = useState<FlowCompany[]>([]);
  const [customFields, setCustomFields] = useState<CustomFields>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [nextStart, setNextStart] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Fetch custom fields first
  useEffect(() => {
    fetchCustomFields();
  }, []);

  // Then fetch companies when custom fields are loaded
  useEffect(() => {
    if (Object.keys(customFields).length > 0) {
      fetchCompanies();
    }
  }, [customFields, currentPage]);

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/supportdesk/api/flow-companies/fields`);
      
      if (response.data && response.data.result) {
        const fields = response.data.result;
        setCustomFields(fields);
        
        // Get UF_CRM fields and standard fields
        const standardFields = ["ID", "TITLE", "ASSIGNED_BY_ID", "DATE_CREATE", "ADDRESS", "ADDRESS_CITY", "ADDRESS_COUNTRY", "PHONE", "EMAIL"];
        const ufCrmFields = Object.keys(fields).filter(key => key.startsWith("UF_CRM"));
        
        setSelectedFields([...standardFields, ...ufCrmFields]);
      } else {
        setError("Özel alanlar yüklenirken bir hata oluştu");
      }
    } catch (err) {
      setError("Özel alanlar yüklenirken bir hata oluştu");
      console.error("Error fetching custom fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `/supportdesk/api/flow-companies`,
        {
          select: selectedFields,
          order: { DATE_CREATE: "DESC" },
          start: (currentPage - 1) * 10,
        }
      );
      
      if (response.data && response.data.result) {
        setCompanies(response.data.result);
        setTotalRecords(response.data.total);
        setNextStart(response.data.next);
        console.log("API Response:", response.data);
      } else {
        setError("Veri formatı beklendiği gibi değil");
      }
    } catch (err) {
      setError("Firmalar yüklenirken bir hata oluştu");
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.TITLE.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Get display columns (standard + UF_CRM fields)
  const getDisplayColumns = () => {
    const standardColumns = [
      { field: "ID", title: "ID", listLabel: "ID" },
      { field: "TITLE", title: "Firma Adı", listLabel: "Firma Adı" },
      { field: "PHONE", title: "Telefon", listLabel: "Telefon" },
      { field: "EMAIL", title: "E-posta", listLabel: "E-posta" },
      { field: "DATE_CREATE", title: "Oluşturma Tarihi", listLabel: "Oluşturma Tarihi" }
    ];
    
    const customColumns = Object.entries(customFields)
      .filter(([key]) => key.startsWith("UF_CRM"))
      .map(([key, field]) => ({
        field: key,
        title: field.title || key,
        listLabel: field.listLabel || field.title || key
      }));
    
    return [...standardColumns, ...customColumns];
  };

  // Format field value based on its type
  const formatFieldValue = (field: string, value: any): string => {
    if (!value) return "-";
    
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

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const importSelectedCompanies = async () => {
    if (selectedCompanies.length === 0) {
      toast.error("Lütfen en az bir firma seçin");
      return;
    }

    try {
      setImporting(true);
      
      // Seçilen firmaları filtrele
      const companiesToImport = companies.filter(company => 
        selectedCompanies.includes(company.ID)
      );

      // API'ye gönderilecek veriyi hazırla
      const importData = companiesToImport.map(company => ({
        name: company.TITLE,
        address: company.ADDRESS || null,
        phone: company.PHONE || null,
        email: company.EMAIL || null,
        city: company.ADDRESS_CITY || null,
        country: company.ADDRESS_COUNTRY || null,
        notes: `Flow'dan içe aktarıldı. Flow ID: ${company.ID}`
      }));

      // API çağrısı yap
      const response = await axios.post('/supportdesk/api/main/companies/importFlowCompanies', {
        companies: importData
      });

      if (response.data.success) {
        toast.success(`${response.data.importedCount} firma başarıyla içe aktarıldı`);
        setSelectedCompanies([]);
      } else {
        toast.error(response.data.message || "İçe aktarma sırasında bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Firmalar içe aktarılırken bir hata oluştu");
    } finally {
      setImporting(false);
    }
  };

  const displayColumns = getDisplayColumns();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Flow Firmaları</h2>
        <div className="flex space-x-2">
          <Link href={`/${params?.tenantId || ''}/imported-flow-companies`}>
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" />
              İçe Aktarılan Firmalar
            </Button>
          </Link>
          <Link href={`/${params?.tenantId || ''}/settings/flow-company-mapping`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Alan Eşleştirme Ayarları
            </Button>
          </Link>
          <Button 
            onClick={importSelectedCompanies} 
            disabled={selectedCompanies.length === 0 || importing}
            className="flex items-center"
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Seçili Firmaları İçe Aktar ({selectedCompanies.length})
          </Button>
        </div>
      </div>
      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies">Firmalar</TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Flow Firma Listesi</CardTitle>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Firma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
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
                              <TableHead className="w-12 text-center">Seç</TableHead>
                              {displayColumns.map((column) => (
                                <TableHead key={column.field} className="text-center whitespace-nowrap">
                                  <div className="font-medium">{column.title}</div>
                                  <div className="text-xs text-muted-foreground">{column.listLabel}</div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompanies.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={displayColumns.length + 1} className="text-center">
                                  Firma bulunamadı
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCompanies.map((company) => (
                                <TableRow key={company.ID} className={selectedCompanies.includes(company.ID) ? "bg-muted/50" : ""}>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedCompanies.includes(company.ID)}
                                        onChange={() => toggleCompanySelection(company.ID)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                    </div>
                                  </TableCell>
                                  {displayColumns.map((column) => (
                                    <TableCell key={`${company.ID}-${column.field}`} className="whitespace-nowrap">
                                      {formatFieldValue(column.field, company[column.field])}
                                    </TableCell>
                                  ))}
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
                      Toplam {String(totalRecords)} kayıt | Sayfa {String(currentPage)}/{String(Math.ceil(totalRecords / 10) || 1)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!nextStart || loading}
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
