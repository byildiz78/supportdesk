"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FaCheck, FaTimes } from "react-icons/fa";
import * as RadioGroup from "@radix-ui/react-radio-group";

interface MobileFilterPanelProps {
  filters: Record<string, any>;
  onFilterChange: (newFilters: any) => void;
  onClose: () => void;
}

export function MobileFilterPanel({ 
  filters, 
  onFilterChange, 
  onClose 
}: MobileFilterPanelProps) {
  // Mock veriler - Gerçek uygulamada bu veriler API'den gelecektir
  const categories = [
    { id: '1', name: 'Donanım' },
    { id: '2', name: 'Yazılım' },
    { id: '3', name: 'Ağ' },
    { id: '4', name: 'Güvenlik' }
  ];
  
  const subcategories = [
    { id: '1', name: 'Bilgisayar' },
    { id: '2', name: 'Yazıcı' },
    { id: '3', name: 'Sunucu' },
    { id: '4', name: 'Mobil Cihaz' }
  ];
  
  const groups = [
    { id: '1', name: 'BT Destek' },
    { id: '2', name: 'Sistem Yönetimi' },
    { id: '3', name: 'Ağ Yönetimi' }
  ];
  
  const users = [
    { id: '1', name: 'Ali Yılmaz' },
    { id: '2', name: 'Ayşe Demir' },
    { id: '3', name: 'Mehmet Kaya' }
  ];
  
  const companies = [
    { id: '1', name: 'ABC Şirketi' },
    { id: '2', name: 'XYZ Şirketi' },
    { id: '3', name: 'LMN Şirketi' }
  ];
  
  const parentCompanies = [
    { id: '1', name: 'Holding A' },
    { id: '2', name: 'Holding B' },
    { id: '3', name: 'Holding C' }
  ];
  
  // Yerel filtre durumu
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters);
  
  // Filtreleri sıfırla
  const resetFilters = () => {
    // Status filtresi hariç diğer filtreleri temizle
    const statusFilter = filters.status ? { status: filters.status } : {};
    setLocalFilters(statusFilter);
  };
  
  // Filtreleri uygula
  const applyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };
  
  // Filtre değişikliklerini işle
  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Çoklu seçim filtrelerini işle
  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    setLocalFilters(prev => {
      const currentValues = prev[key] || [];
      
      if (checked) {
        return {
          ...prev,
          [key]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [key]: currentValues.filter((v: string) => v !== value)
        };
      }
    });
  };
  
  // SLA ihlali filtresini işle
  const handleSlaBreachChange = (value: string) => {
    if (value === "all") {
      // "Tümü" seçildiğinde sla_breach filtresini kaldır
      const { sla_breach, ...rest } = localFilters;
      setLocalFilters(rest);
    } else {
      setLocalFilters(prev => ({
        ...prev,
        sla_breach: value === "true"
      }));
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-1">
          {/* Öncelik Filtresi */}
          <div>
            <h3 className="font-medium mb-3">Öncelik</h3>
            <div className="grid grid-cols-2 gap-2">
              {["low", "normal", "high", "urgent", "critical"].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`priority-${priority}`}
                    checked={(localFilters.priority || []).includes(priority)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange("priority", priority, checked === true)
                    }
                  />
                  <Label htmlFor={`priority-${priority}`} className="capitalize">
                    {priority === "low" ? "Düşük" : 
                     priority === "normal" ? "Normal" : 
                     priority === "high" ? "Yüksek" : 
                     priority === "urgent" ? "Acil" : "Kritik"}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* SLA İhlali Filtresi */}
          <div>
            <h3 className="font-medium mb-3">SLA Durumu</h3>
            <RadioGroup.Root 
              value={localFilters.sla_breach === undefined ? "all" : localFilters.sla_breach ? "true" : "false"}
              onValueChange={handleSlaBreachChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroup.Item value="all" id="sla-all" />
                <Label htmlFor="sla-all">Tümü</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroup.Item value="true" id="sla-breach" />
                <Label htmlFor="sla-breach">SLA İhlali Olanlar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroup.Item value="false" id="sla-no-breach" />
                <Label htmlFor="sla-no-breach">SLA İhlali Olmayanlar</Label>
              </div>
            </RadioGroup.Root>
          </div>
          
          <Separator />
          
          {/* Kategori Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="categories">
              <AccordionTrigger className="font-medium">Kategoriler</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category.id}`}
                        checked={(localFilters.category || []).includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("category", category.id, checked === true)
                        }
                      />
                      <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Alt Kategori Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="subcategories">
              <AccordionTrigger className="font-medium">Alt Kategoriler</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`subcategory-${subcategory.id}`}
                        checked={(localFilters.subcategory || []).includes(subcategory.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("subcategory", subcategory.id, checked === true)
                        }
                      />
                      <Label htmlFor={`subcategory-${subcategory.id}`}>{subcategory.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Grup Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="groups">
              <AccordionTrigger className="font-medium">Gruplar</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`group-${group.id}`}
                        checked={(localFilters.group || []).includes(group.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("group", group.id, checked === true)
                        }
                      />
                      <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Atanan Kişi Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assigned_to">
              <AccordionTrigger className="font-medium">Atanan Kişi</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.id}`}
                        checked={(localFilters.assigned_to || []).includes(user.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("assigned_to", user.id, checked === true)
                        }
                      />
                      <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Ana Firma Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="parent_companies">
              <AccordionTrigger className="font-medium">Ana Firmalar</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {parentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`parent-company-${company.id}`}
                        checked={(localFilters.parent_company_id || []).includes(company.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("parent_company_id", company.id, checked === true)
                        }
                      />
                      <Label htmlFor={`parent-company-${company.id}`}>{company.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Firma Filtresi */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="companies">
              <AccordionTrigger className="font-medium">Firmalar</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`company-${company.id}`}
                        checked={(localFilters.company_id || []).includes(company.id)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange("company_id", company.id, checked === true)
                        }
                      />
                      <Label htmlFor={`company-${company.id}`}>{company.name}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
      
      {/* Alt Butonlar */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 mt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="flex items-center"
        >
          <FaTimes className="mr-2 h-4 w-4" />
          Sıfırla
        </Button>
        <Button 
          onClick={applyFilters}
          className="flex items-center"
        >
          <FaCheck className="mr-2 h-4 w-4" />
          Uygula
        </Button>
      </div>
    </div>
  );
}
