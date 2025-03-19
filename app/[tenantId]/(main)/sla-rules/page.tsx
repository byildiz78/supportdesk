"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/stores/tab-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Edit, Trash, Clock } from "lucide-react";
import { SLARuleForm } from "./components/sla-rule-form";

// SLA Rule interface
interface SLARule {
  id: string;
  name: string;
  priorityLevel: number;
  priorityName: string;
  customers: string[];
  categories: string[];
  subCategories: string[];
  departments: string[];
  groups: string[];
  businessHours: number;
  nonBusinessHours: number;
  weekendBusinessHours: number;
  weekendNonBusinessHours: number;
  createdAt: string;
  status: "active" | "inactive";
}

// Mock data for SLA rules
const mockSLARules: SLARule[] = [
  {
    id: "1",
    name: "Kritik Sorunlar - Genel",
    priorityLevel: 1,
    priorityName: "Kritik",
    customers: [],
    categories: [],
    subCategories: [],
    departments: [],
    groups: [],
    businessHours: 2,
    nonBusinessHours: 4,
    weekendBusinessHours: 4,
    weekendNonBusinessHours: 8,
    createdAt: "2025-02-15T10:30:00Z",
    status: "active",
  },
  {
    id: "2",
    name: "Standart Talepler - Genel",
    priorityLevel: 2,
    priorityName: "Yüksek",
    customers: [],
    categories: [],
    subCategories: [],
    departments: [],
    groups: [],
    businessHours: 4,
    nonBusinessHours: 8,
    weekendBusinessHours: 8,
    weekendNonBusinessHours: 16,
    createdAt: "2025-02-16T14:20:00Z",
    status: "active",
  },
  {
    id: "3",
    name: "Düşük Öncelikli Talepler - Genel",
    priorityLevel: 3,
    priorityName: "Orta",
    customers: [],
    categories: [],
    subCategories: [],
    departments: [],
    groups: [],
    businessHours: 8,
    nonBusinessHours: 16,
    weekendBusinessHours: 16,
    weekendNonBusinessHours: 24,
    createdAt: "2025-02-17T09:15:00Z",
    status: "active",
  },
  {
    id: "4",
    name: "VIP Müşteri - Kritik Sorunlar",
    priorityLevel: 1,
    priorityName: "Kritik",
    customers: ["ABC Holding"],
    categories: [],
    subCategories: [],
    departments: [],
    groups: [],
    businessHours: 1,
    nonBusinessHours: 2,
    weekendBusinessHours: 2,
    weekendNonBusinessHours: 4,
    createdAt: "2025-02-18T11:45:00Z",
    status: "active",
  },
  {
    id: "5",
    name: "Teknik Sorunlar - Yazılım",
    priorityLevel: 2,
    priorityName: "Yüksek",
    customers: [],
    categories: ["Teknik Destek"],
    subCategories: ["Yazılım"],
    departments: ["IT"],
    groups: [],
    businessHours: 3,
    nonBusinessHours: 6,
    weekendBusinessHours: 6,
    weekendNonBusinessHours: 12,
    createdAt: "2025-02-19T13:10:00Z",
    status: "active",
  },
  {
    id: "6",
    name: "Donanım Sorunları - Acil",
    priorityLevel: 1,
    priorityName: "Kritik",
    customers: [],
    categories: ["Teknik Destek"],
    subCategories: ["Donanım"],
    departments: ["IT"],
    groups: [],
    businessHours: 2,
    nonBusinessHours: 4,
    weekendBusinessHours: 4,
    weekendNonBusinessHours: 8,
    createdAt: "2025-02-20T15:30:00Z",
    status: "active",
  },
  {
    id: "7",
    name: "Finans Grubu - Standart Talepler",
    priorityLevel: 2,
    priorityName: "Yüksek",
    customers: [],
    categories: [],
    subCategories: [],
    departments: ["Finans"],
    groups: ["Finans"],
    businessHours: 4,
    nonBusinessHours: 8,
    weekendBusinessHours: 8,
    weekendNonBusinessHours: 16,
    createdAt: "2025-02-21T10:00:00Z",
    status: "active",
  },
  {
    id: "8",
    name: "IT Grubu - Kritik Sorunlar",
    priorityLevel: 1,
    priorityName: "Kritik",
    customers: [],
    categories: [],
    subCategories: [],
    departments: ["IT"],
    groups: ["IT"],
    businessHours: 1,
    nonBusinessHours: 3,
    weekendBusinessHours: 3,
    weekendNonBusinessHours: 6,
    createdAt: "2025-02-22T09:20:00Z",
    status: "inactive",
  },
];

export default function SLARulesPage() {
  const pathname = usePathname();
  const tenantId = pathname?.split("/")[1] || "";
  const { addTab } = useTabStore();
  const [slaRules, setSLARules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingRule, setEditingRule] = useState<SLARule | null>(null);

  useEffect(() => {
    // Simulate API call to fetch SLA rules
    const fetchSLARules = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await axios.get(`/supportdesk/api/main/sla/rules`);
        // const data = response.data;
        
        // Using mock data instead
        setTimeout(() => {
          setSLARules(mockSLARules);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching SLA rules:", error);
        setLoading(false);
      }
    };

    // Add tab
    addTab({
      id: `sla-rules-${tenantId}`,
      title: "SLA Kuralları",
      url: `/supportdesk/${tenantId}/sla-rules`,
      lazyComponent: async () => ({ default: () => <div /> })
    });

    fetchSLARules();
  }, []);

  // Sort rules by priority level
  const sortedRules = [...slaRules].sort((a, b) => a.priorityLevel - b.priorityLevel);

  const getPriorityBadgeColor = (priorityName: string) => {
    switch (priorityName) {
      case "Kritik":
        return "bg-red-500";
      case "Yüksek":
        return "bg-yellow-500";
      case "Orta":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const formatHours = (hours: number) => {
    return `${hours} saat`;
  };

  const handleAddRule = (data: any) => {
    // In a real app, this would be an API call
    // const response = await axios.post(`/supportdesk/api/main/sla/rules`, data);
    
    // Using mock data instead
    const newRule: SLARule = {
      id: `${slaRules.length + 1}`,
      name: data.name,
      priorityLevel: data.priorityLevel,
      priorityName: data.priorityName,
      customers: data.customers || [],
      categories: data.categories || [],
      subCategories: data.subCategories || [],
      departments: data.departments || [],
      groups: data.groups || [],
      businessHours: data.businessHours,
      nonBusinessHours: data.nonBusinessHours,
      weekendBusinessHours: data.weekendBusinessHours,
      weekendNonBusinessHours: data.weekendNonBusinessHours,
      status: data.status as "active" | "inactive",
      createdAt: new Date().toISOString(),
    };
    
    setSLARules([...slaRules, newRule]);
    setOpenForm(false);
  };

  const handleEditRule = (rule: SLARule) => {
    setEditingRule(rule);
    setOpenForm(true);
  };

  const handleUpdateRule = (data: any) => {
    // In a real app, this would be an API call
    // const response = await axios.put(`/supportdesk/api/main/sla/rules/${editingRule.id}`, data);
    
    // Using mock data instead
    const updatedRules = slaRules.map((rule) => 
      rule.id === editingRule?.id 
        ? { 
            ...rule, 
            name: data.name,
            priorityLevel: data.priorityLevel,
            priorityName: data.priorityName,
            customers: data.customers || [],
            categories: data.categories || [],
            subCategories: data.subCategories || [],
            departments: data.departments || [],
            groups: data.groups || [],
            businessHours: data.businessHours,
            nonBusinessHours: data.nonBusinessHours,
            weekendBusinessHours: data.weekendBusinessHours,
            weekendNonBusinessHours: data.weekendNonBusinessHours,
            status: data.status as "active" | "inactive",
          } 
        : rule
    );
    
    setSLARules(updatedRules);
    setEditingRule(null);
    setOpenForm(false);
  };

  const handleToggleStatus = (ruleId: string) => {
    // In a real app, this would be an API call
    // const response = await axios.patch(`/supportdesk/api/main/sla/rules/${ruleId}/toggle-status`);
    
    // Using mock data instead
    const updatedRules = slaRules.map((rule) => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === "active" ? "inactive" : "active" } 
        : rule
    );
    
    setSLARules(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    // In a real app, this would be an API call
    // const response = await axios.delete(`/supportdesk/api/main/sla/rules/${ruleId}`);
    
    // Using mock data instead
    const updatedRules = slaRules.filter((rule) => rule.id !== ruleId);
    setSLARules(updatedRules);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SLA Kuralları</h1>
        <Button onClick={() => setOpenForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni SLA Kuralı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tanımlı SLA Kuralları</CardTitle>
          <CardDescription>
            Destek talepleriniz için tanımlanmış SLA kurallarını görüntüleyin ve yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kural Adı</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Filtreler</TableHead>
                  <TableHead>Mesai Saatleri</TableHead>
                  <TableHead>Mesai Dışı</TableHead>
                  <TableHead>Hafta Sonu (Mesai)</TableHead>
                  <TableHead>Hafta Sonu (Mesai Dışı)</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(rule.priorityName)}>
                        {rule.priorityName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {rule.customers.length > 0 && (
                          <span>Müşteri: {rule.customers.join(", ")}</span>
                        )}
                        {rule.categories.length > 0 && (
                          <span>Kategori: {rule.categories.join(", ")}</span>
                        )}
                        {rule.subCategories.length > 0 && (
                          <span>Alt Kategori: {rule.subCategories.join(", ")}</span>
                        )}
                        {rule.departments.length > 0 && (
                          <span>Bölüm: {rule.departments.join(", ")}</span>
                        )}
                        {rule.groups.length > 0 && (
                          <span>Grup: {rule.groups.join(", ")}</span>
                        )}
                        {rule.customers.length === 0 &&
                          rule.categories.length === 0 &&
                          rule.subCategories.length === 0 &&
                          rule.departments.length === 0 &&
                          rule.groups.length === 0 && <span>Genel</span>}
                      </div>
                    </TableCell>
                    <TableCell>{formatHours(rule.businessHours)}</TableCell>
                    <TableCell>{formatHours(rule.nonBusinessHours)}</TableCell>
                    <TableCell>
                      {formatHours(rule.weekendBusinessHours)}
                    </TableCell>
                    <TableCell>
                      {formatHours(rule.weekendNonBusinessHours)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.status === "active" ? "default" : "outline"}
                      >
                        {rule.status === "active" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(rule.id)}>
                            <Clock className="mr-2 h-4 w-4" />
                            {rule.status === "active"
                              ? "Pasif Yap"
                              : "Aktif Yap"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SLARuleForm
        open={openForm}
        onOpenChange={setOpenForm}
        initialData={editingRule}
        onSubmit={editingRule ? handleUpdateRule : handleAddRule}
      />
    </div>
  );
}
