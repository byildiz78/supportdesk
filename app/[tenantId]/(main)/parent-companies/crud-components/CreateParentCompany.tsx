"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Save, Building2, Mail, Phone, Hash, FileText, Globe, MapPin, Briefcase } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useParentCompaniesStore } from "@/stores/main/parent-companies-store";
import { useTabStore } from "@/stores/tab-store";
import { useFilterStore } from "@/stores/filters-store";
import { toast } from "@/components/ui/toast/use-toast";
import axios from "@/lib/axios";
import { Switch } from "@/components/ui/switch";

interface CreateParentCompanyProps {
  companyId?: string;
}

export default function CreateParentCompany({ companyId }: CreateParentCompanyProps) {
  const { removeTab, setActiveTab } = useTabStore();
  const { selectedFilter } = useFilterStore();
  const { addParentCompany, updateParentCompany, parentCompanies } = useParentCompaniesStore();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCompanyData, setParentCompanyData] = useState({
    name: "",
    taxId: "",
    taxOffice: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    industry: "",
    companyType: "",
    notes: "",
    isActive: true,
  });

  // Eğer düzenleme modu ise, mevcut ana firma verilerini form'a doldur
  useEffect(() => {
    if (companyId) {
      // Store'dan ana firma verilerini al
      const parentCompanyToEdit = parentCompanies.find((c) => c.id === companyId);

      if (parentCompanyToEdit) {
        setParentCompanyData({
          ...parentCompanyToEdit,
          taxId: parentCompanyToEdit.taxId || "",
          taxOffice: parentCompanyToEdit.taxOffice || "",
          address: parentCompanyToEdit.address || "",
          city: parentCompanyToEdit.city || "",
          state: parentCompanyToEdit.state || "",
          postalCode: parentCompanyToEdit.postalCode || "",
          country: parentCompanyToEdit.country || "",
          phone: parentCompanyToEdit.phone || "",
          email: parentCompanyToEdit.email || "",
          website: parentCompanyToEdit.website || "",
          industry: parentCompanyToEdit.industry || "",
          companyType: parentCompanyToEdit.companyType || "",
          notes: parentCompanyToEdit.notes || "",
        });
      }
    }
  }, [companyId, parentCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Ana firma verilerini API'ye gönder
      const response = await axios.post("/api/main/parent-companies/createUpdateParentCompany", {
        ...parentCompanyData,
        id: companyId,
        tenantId: selectedFilter?.branchParam,
      });

      if (response.data.success) {
        if (companyId) {
          // Mevcut ana firmayı güncelle
          updateParentCompany({
            ...parentCompanyData as any,
            id: companyId,
            updatedAt: new Date(),
          });

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Ana firma bilgileri güncellendi",
            variant: "default",
          });
        } else {
          // Yeni ID ile ana firma nesnesini oluştur
          const newParentCompany = {
            ...parentCompanyData as any,
            id: response.data.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
          };

          // Store'a ekle
          addParentCompany(newParentCompany);

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Yeni ana firma oluşturuldu",
            variant: "default",
          });
        }

        // Sekmeyi kapat ve ana firma listesine dön
        const tabId = companyId ? `edit-company-${companyId}` : "Yeni Ana Firma";
        // Tüm sekmeleri kontrol et ve doğru sekmeyi bul
        const allTabs = useTabStore.getState().tabs;
        // Ana firma ID'sine göre sekmeyi bul (edit-company ile başlayan)
        if (companyId) {
          const tabToRemove = allTabs.find((tab) => tab.id.includes(`-${companyId}`));
          if (tabToRemove) {
            removeTab(tabToRemove.id);
          } else {
            removeTab(tabId); // Yine de orijinal ID ile dene
          }
        } else {
          // Yeni ana firma sekmesini kapat
          removeTab(tabId);
        }

        setActiveTab("Ana Firmalar");
      } else {
        setError(response.data.message || "Ana firma kaydedilirken bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setError(error.response?.data?.message || error.message || "Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-6 pb-24">
          {/* Ana Firma Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Ana Firma Bilgileri
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel ana firma bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Firma Adı</Label>
                  <Input
                    value={parentCompanyData.name || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ana firma adı"
                  />
                </div>
                <div>
                  <Label>Vergi No</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={parentCompanyData.taxId || ""}
                      onChange={(e) => setParentCompanyData((prev) => ({ ...prev, taxId: e.target.value }))}
                      placeholder="Vergi numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={parentCompanyData.taxOffice || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, taxOffice: e.target.value }))}
                    placeholder="Vergi dairesi"
                  />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      value={parentCompanyData.email || ""}
                      onChange={(e) => setParentCompanyData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="E-posta adresi"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={parentCompanyData.phone || ""}
                      onChange={(e) => setParentCompanyData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefon numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={parentCompanyData.website || ""}
                      onChange={(e) => setParentCompanyData((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="Website adresi"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Aktif</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={parentCompanyData.isActive}
                      onCheckedChange={(checked) => setParentCompanyData((prev) => ({ ...prev, isActive: checked }))}
                    />
                    <span>{parentCompanyData.isActive ? "Aktif" : "Pasif"}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Adres Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Adres Bilgileri
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Ana firma adres ve konum bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Adres</Label>
                  <Textarea
                    value={parentCompanyData.address || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Ana firma adresi"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Input
                    value={parentCompanyData.city || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <Label>İlçe/Bölge</Label>
                  <Input
                    value={parentCompanyData.state || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="İlçe veya bölge"
                  />
                </div>
                <div>
                  <Label>Posta Kodu</Label>
                  <Input
                    value={parentCompanyData.postalCode || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Posta kodu"
                  />
                </div>
                <div>
                  <Label>Ülke</Label>
                  <Input
                    value={parentCompanyData.country || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="Ülke"
                    defaultValue="Türkiye"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Ek Bilgiler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    Ek Bilgiler
                  </h3>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                    Ana firma ile ilgili diğer bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Sektör</Label>
                  <Input
                    value={parentCompanyData.industry || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, industry: e.target.value }))}
                    placeholder="Ana firmanın faaliyet gösterdiği sektör"
                  />
                </div>
                <div>
                  <Label>Firma Türü</Label>
                  <Input
                    value={parentCompanyData.companyType || ""}
                    onChange={(e) => setParentCompanyData((prev) => ({ ...prev, companyType: e.target.value }))}
                    placeholder="Ana firma türü"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Özel Notlar</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={parentCompanyData.notes || ""}
                      onChange={(e) => setParentCompanyData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Özel notlar"
                      className="min-h-[100px] pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Save Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t mt-auto">
        <div className="flex justify-end max-w-full mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Kaydediliyor..." : companyId ? "Ana Firmayı Güncelle" : "Ana Firmayı Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
