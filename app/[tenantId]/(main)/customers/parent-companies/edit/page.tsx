"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Save, Loader2 } from "lucide-react";
import { useParentCompanies } from "@/hooks/use-parent-companies";
import { MainCompany } from "@/types/customers";

// Form şeması
const formSchema = z.object({
  name: z.string().min(2, { message: "Firma adı en az 2 karakter olmalıdır" }),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz" }).optional().or(z.literal("")),
  flowId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditParentCompanyPageProps {
  parentCompanyId: string;
}

export default function EditParentCompanyPage({ parentCompanyId }: EditParentCompanyPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchParentCompany, updateParentCompanyById } = useParentCompanies({ initialLoad: false });

  // Form tanımla
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      flowId: "",
      notes: "",
    },
  });

  // Ana şirket verilerini yükle
  useEffect(() => {
    const loadParentCompany = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const company = await fetchParentCompany(parentCompanyId);
        
        // Form değerlerini güncelle
        form.reset({
          name: company.name,
          address: company.address || "",
          phone: company.phone || "",
          email: company.email || "",
          flowId: company.flowId || "",
          notes: company.notes || "",
        });
      } catch (err: any) {
        console.error("Ana şirket yüklenirken hata:", err);
        setError(err.message || "Ana şirket yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadParentCompany();
  }, [parentCompanyId, fetchParentCompany, form]);

  // Form gönderildiğinde
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateParentCompanyById(parentCompanyId, {
        ...data,
        updatedBy: "system", // Gerçek kullanıcı bilgisi eklenebilir
      });
      
      toast({
        title: "Başarılı",
        description: "Ana firma başarıyla güncellendi",
        variant: "default",
      });
      
      // Ana firma detay sayfasına geri dön
      router.back();
    } catch (error: any) {
      console.error("Ana firma güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: error.message || "Ana firma güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-muted-foreground">Ana şirket yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <Building2 className="h-10 w-10 text-red-500" />
          <h2 className="text-xl font-bold">Bir hata oluştu</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Ana Firma Düzenle
          </h2>
          <p className="text-muted-foreground">
            Ana firma bilgilerini güncelleyin
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ana Firma Bilgileri</CardTitle>
          <CardDescription>
            Ana firma için güncellenecek bilgileri düzenleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firma Adı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Firma adını giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input placeholder="E-posta adresini giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="Telefon numarasını giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flowId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vergi Numarası / Flow ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Vergi numarasını giriniz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Firma adresini giriniz"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Firma ile ilgili notları giriniz"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Kaydediliyor..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
