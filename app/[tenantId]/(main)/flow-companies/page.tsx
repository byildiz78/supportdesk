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
import { Search, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Download, Filter } from "lucide-react";
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
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [nextStart, setNextStart] = useState(0);
  const [pageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

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
          start: (currentPage - 1) * pageSize,
        }
      );
      
      if (response.data && response.data.result) {
        setCompanies(response.data.result);
        setTotalRecords(response.data.total);
        setNextStart(response.data.next);
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

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.TITLE.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

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

  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(company => company.ID));
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-h-[80vh] overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Flow Firmaları</h2>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export CSV</DropdownMenuItem>
              <DropdownMenuItem>Export Excel</DropdownMenuItem>
              <DropdownMenuItem>Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies" className="relative">
            Firmalar 
            {totalRecords > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {totalRecords}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Flow Firma Listesi</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Firma ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" /> Kolonlar
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
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Yükleniyor...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center py-4 text-red-500">{error}</div>
              ) : (
                <>
                  {/* Fixed width wrapper that doesn't expand with table */}
                  <div className="w-full rounded-md border overflow-hidden" style={{ maxWidth: '100%' }}>
                    {/* Container with both horizontal and vertical scrolling */}
                    <div>
                      {/* Table with fixed layout to prevent column expansion */}
                      <table className="w-full border-collapse table-fixed">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="w-12 p-3 sticky left-0 bg-muted/50 z-20 text-center">
                              <Checkbox
                                checked={
                                  selectedCompanies.length > 0 &&
                                  selectedCompanies.length === filteredCompanies.length
                                }
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                              />
                            </th>
                            {displayColumns.map((column, index) => (
                              <th 
                                key={column.field}
                                className={`p-3 text-center border-b ${index === 0 ? "sticky left-12 bg-muted/50 z-20" : ""}`}
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
                          {filteredCompanies.length === 0 ? (
                            <tr>
                              <td colSpan={displayColumns.length + 2} className="p-4 text-center border-b">
                                Veri bulunamadı.
                              </td>
                            </tr>
                          ) : (
                            filteredCompanies.map((company) => (
                              <tr 
                                key={company.ID}
                                className={`border-b ${selectedCompanies.includes(company.ID) ? "bg-muted/30" : ""}`}
                              >
                                <td className="p-3 sticky left-0 bg-white z-20 text-center">
                                  <Checkbox
                                    checked={selectedCompanies.includes(company.ID)}
                                    onCheckedChange={() => handleSelectCompany(company.ID)}
                                    aria-label={`Select ${company.TITLE}`}
                                  />
                                </td>
                                {displayColumns.map((column, index) => (
                                  <td 
                                    key={`${company.ID}-${column.field}`}
                                    className={`p-3 border-b ${index === 0 ? "sticky left-12 bg-white z-20" : ""} ${
                                      column.field === "ID" ? "text-center font-mono text-xs" :
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
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Toplam {totalRecords} firma | {selectedCompanies.length} seçili | Sayfa {currentPage}/{Math.ceil(totalRecords / pageSize) || 1}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
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
                      
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!nextStart || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
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