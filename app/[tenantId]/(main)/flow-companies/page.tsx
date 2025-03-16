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
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  const [companies, setCompanies] = useState<FlowCompany[]>([]);
  const [customFields, setCustomFields] = useState<CustomFields>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [nextStart, setNextStart] = useState(0);

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

  const displayColumns = getDisplayColumns();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Flow Firmaları</h2>
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
                                <TableCell colSpan={displayColumns.length} className="text-center">
                                  Firma bulunamadı
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCompanies.map((company) => (
                                <TableRow key={company.ID}>
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
