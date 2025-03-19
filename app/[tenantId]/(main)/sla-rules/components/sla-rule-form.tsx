"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PlusCircle, Edit, FilterIcon, Clock, Sun, Moon } from "lucide-react";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "SLA kuralı adı en az 2 karakter olmalıdır.",
  }),
  priorityLevel: z.coerce.number().min(1, {
    message: "Öncelik seviyesi seçilmelidir.",
  }),
  priorityName: z.string().min(1, {
    message: "Öncelik adı girilmelidir.",
  }),
  customers: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  subCategories: z.array(z.string()).default([]),
  departments: z.array(z.string()).default([]),
  groups: z.array(z.string()).default([]),
  businessHours: z.coerce.number().min(1, {
    message: "Mesai saatleri içinde SLA süresi en az 1 saat olmalıdır.",
  }),
  nonBusinessHours: z.coerce.number().min(1, {
    message: "Mesai saatleri dışında SLA süresi en az 1 saat olmalıdır.",
  }),
  weekendBusinessHours: z.coerce.number().min(1, {
    message: "Hafta sonu mesai saatleri içinde SLA süresi en az 1 saat olmalıdır.",
  }),
  weekendNonBusinessHours: z.coerce.number().min(1, {
    message: "Hafta sonu mesai saatleri dışında SLA süresi en az 1 saat olmalıdır.",
  }),
  status: z.enum(["active", "inactive"]),
});

// Mock data for dropdowns
const mockCustomers = [
  { id: "1", name: "ABC Holding" },
  { id: "2", name: "XYZ Teknoloji" },
  { id: "3", name: "123 Sanayi" },
];

const mockCategories = [
  { id: "1", name: "Teknik Destek" },
  { id: "2", name: "Finansal Destek" },
  { id: "3", name: "Genel Destek" },
];

const mockSubCategories = [
  { id: "1", name: "Yazılım", categoryId: "1" },
  { id: "2", name: "Donanım", categoryId: "1" },
  { id: "3", name: "Ağ", categoryId: "1" },
  { id: "4", name: "Fatura", categoryId: "2" },
  { id: "5", name: "Ödeme", categoryId: "2" },
  { id: "6", name: "Bilgi Talebi", categoryId: "3" },
];

const mockDepartments = [
  { id: "1", name: "IT" },
  { id: "2", name: "Finans" },
  { id: "3", name: "Satış" },
  { id: "4", name: "Müşteri Hizmetleri" },
];

const mockGroups = [
  { id: "1", name: "IT" },
  { id: "2", name: "Finans" },
  { id: "3", name: "Satış" },
  { id: "4", name: "Müşteri Hizmetleri" },
];

interface SLARuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSubmit: (data: any) => void;
}

export function SLARuleForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: SLARuleFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    initialData?.category
  );

  // Initialize form with default values or initial data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      priorityLevel: 2,
      priorityName: "Orta",
      customers: [],
      categories: [],
      subCategories: [],
      departments: [],
      groups: [],
      businessHours: 4,
      nonBusinessHours: 8,
      weekendBusinessHours: 8,
      weekendNonBusinessHours: 16,
      status: "active",
    },
  });

  // Filter subcategories based on selected category
  const filteredSubCategories = selectedCategory
    ? mockSubCategories.filter((sc) => sc.categoryId === selectedCategory)
    : [];

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {initialData ? (
              <>
                <Edit className="h-6 w-6 text-primary" />
                SLA Kuralını Düzenle
              </>
            ) : (
              <>
                <PlusCircle className="h-6 w-6 text-primary" />
                Yeni SLA Kuralı Ekle
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            SLA kuralı bilgilerini girin. Bu kural, destek taleplerinin çözüm sürelerini belirlemek için kullanılacaktır.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rule Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Kural Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Kural adı girin" {...field} className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Durum</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              Aktif
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              Pasif
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Priority Level */}
                <FormField
                  control={form.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Öncelik Seviyesi</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Öncelik seviyesi girin" 
                          {...field} 
                          className="h-10"
                        />
                      </FormControl>
                      <FormDescription>
                        Daha düşük sayı daha yüksek önceliği belirtir (1 en yüksek)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority Name */}
                <FormField
                  control={form.control}
                  name="priorityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Öncelik Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Öncelik adı girin" {...field} className="h-10" />
                      </FormControl>
                      <FormDescription>
                        Örn: Kritik, Yüksek, Orta, Düşük
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {/* Filters Section */}
              <AccordionItem value="filters" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 rounded-t-lg">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <FilterIcon className="h-5 w-5" />
                    Filtreler
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customers */}
                    <FormField
                      control={form.control}
                      name="customers"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Müşteriler</FormLabel>
                            <FormDescription>
                              Bu SLA kuralının uygulanacağı müşterileri seçin
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SearchableMultiSelect
                              options={mockCustomers.map((customer) => ({
                                value: customer.id,
                                label: customer.name,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Müşteri seçiniz"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Departments */}
                    <FormField
                      control={form.control}
                      name="departments"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Departmanlar</FormLabel>
                            <FormDescription>
                              Bu SLA kuralının uygulanacağı departmanları seçin
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SearchableMultiSelect
                              options={mockDepartments.map((department) => ({
                                value: department.id,
                                label: department.name,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Departman seçiniz"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Categories */}
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Kategoriler</FormLabel>
                            <FormDescription>
                              Bu SLA kuralının uygulanacağı kategorileri seçin
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SearchableMultiSelect
                              options={mockCategories.map((category) => ({
                                value: category.id,
                                label: category.name,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Kategori seçiniz"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SubCategories */}
                    <FormField
                      control={form.control}
                      name="subCategories"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Alt Kategoriler</FormLabel>
                            <FormDescription>
                              Bu SLA kuralının uygulanacağı alt kategorileri seçin
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SearchableMultiSelect
                              options={filteredSubCategories.map((subCategory) => ({
                                value: subCategory.id,
                                label: subCategory.name,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Alt kategori seçiniz"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Groups */}
                    <FormField
                      control={form.control}
                      name="groups"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">Gruplar</FormLabel>
                            <FormDescription>
                              Bu SLA kuralının uygulanacağı grupları seçin
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SearchableMultiSelect
                              options={mockGroups.map((group) => ({
                                value: group.id,
                                label: group.name,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Grup seçiniz"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SLA Times Section */}
              <AccordionItem value="sla-times" className="border rounded-lg mt-4">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 rounded-t-lg">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Clock className="h-5 w-5" />
                    SLA Süreleri
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-2">
                  <div className="bg-muted/30 p-4 rounded-lg border mb-4">
                    <h4 className="text-base font-medium mb-2">Hafta İçi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Hours */}
                      <FormField
                        control={form.control}
                        name="businessHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Sun className="h-4 w-4 text-yellow-500" />
                              Mesai Saatleri İçinde
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Süre girin"
                                  {...field}
                                  className="h-10"
                                />
                                <span className="ml-2 text-muted-foreground">saat</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Mesai saatleri içinde çözülmesi gereken süre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Non-Business Hours */}
                      <FormField
                        control={form.control}
                        name="nonBusinessHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Moon className="h-4 w-4 text-blue-500" />
                              Mesai Saatleri Dışında
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Süre girin"
                                  {...field}
                                  className="h-10"
                                />
                                <span className="ml-2 text-muted-foreground">saat</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Mesai saatleri dışında çözülmesi gereken süre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h4 className="text-base font-medium mb-2">Hafta Sonu</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Weekend Business Hours */}
                      <FormField
                        control={form.control}
                        name="weekendBusinessHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Sun className="h-4 w-4 text-yellow-500" />
                              Mesai Saatleri İçinde
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Süre girin"
                                  {...field}
                                  className="h-10"
                                />
                                <span className="ml-2 text-muted-foreground">saat</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Hafta sonu mesai saatleri içinde çözülmesi gereken süre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Weekend Non-Business Hours */}
                      <FormField
                        control={form.control}
                        name="weekendNonBusinessHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Moon className="h-4 w-4 text-blue-500" />
                              Mesai Saatleri Dışında
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Süre girin"
                                  {...field}
                                  className="h-10"
                                />
                                <span className="ml-2 text-muted-foreground">saat</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Hafta sonu mesai saatleri dışında çözülmesi gereken süre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter className="pt-4 border-t mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Kaydediliyor...
                  </>
                ) : initialData ? (
                  "Güncelle"
                ) : (
                  "Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
