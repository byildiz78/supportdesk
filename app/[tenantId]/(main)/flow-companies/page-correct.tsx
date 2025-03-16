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
import { Search } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface FlowCompany {
  ID: string;
  TITLE: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
}

export default function FlowCompaniesPage() {
  const [companies, setCompanies] = useState<FlowCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${window.location.origin}/supportdesk/api/flow-companies`,
        {
          select: ["ID", "TITLE", "ASSIGNED_BY_ID", "DATE_CREATE"],
          order: { DATE_CREATE: "DESC" },
          start: 0,
        }
      );
      
      if (response.data && response.data.result) {
        setCompanies(response.data.result);
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
                <div className="flex justify-center py-4">Yükleniyor...</div>
              ) : error ? (
                <div className="flex justify-center py-4 text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Firma Adı</TableHead>
                      <TableHead>Atanan Kullanıcı ID</TableHead>
                      <TableHead>Oluşturma Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Firma bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies.map((company) => (
                        <TableRow key={company.ID}>
                          <TableCell>{company.ID}</TableCell>
                          <TableCell>{company.TITLE}</TableCell>
                          <TableCell>{company.ASSIGNED_BY_ID}</TableCell>
                          <TableCell>{formatDate(company.DATE_CREATE)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
