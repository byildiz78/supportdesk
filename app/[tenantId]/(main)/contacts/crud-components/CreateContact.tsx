"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Save, User, Mail, Phone, Building2, FileText, MapPin, Briefcase, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useContactsStore } from "@/stores/main/contacts-store";
import { useTabStore } from "@/stores/tab-store";
import { useFilterStore } from "@/stores/filters-store";
import { toast } from "@/components/ui/toast/use-toast";
import axios from "@/lib/axios";
import { Switch } from "@/components/ui/switch";
import { useCompanies } from "@/providers/companies-provider";
import ReactSelect from "react-select";
import { debounce } from "lodash";

interface CreateContactProps {
  contactId?: string;
}

export default function CreateContact({ contactId }: CreateContactProps) {
  const { removeTab, setActiveTab } = useTabStore();
  const { selectedFilter } = useFilterStore();
  const { addContact, updateContact, contacts } = useContactsStore();
  const { companies, loading: isLoadingCompanies } = useCompanies();
  const [error, setError] = useState("");
  const [existingContact, setExistingContact] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInputValue, setCompanyInputValue] = useState("");
  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    position: "",
    companyId: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    notes: "",
    isPrimary: false,
    isActive: true,
  });

  // Eğer düzenleme modu ise, mevcut kişi verilerini form'a doldur
  useEffect(() => {
    if (contactId) {
      // Store'dan kişi verilerini al
      const contactToEdit = contacts.find((c) => c.id === contactId);

      if (contactToEdit) {
        setContactData({
          ...contactToEdit,
          firstName: contactToEdit.firstName || "",
          lastName: contactToEdit.lastName || "",
          position: contactToEdit.position || "",
          companyId: contactToEdit.companyId || "",
          email: contactToEdit.email || "",
          phone: contactToEdit.phone || "",
          mobile: contactToEdit.mobile || "",
          address: contactToEdit.address || "",
          city: contactToEdit.city || "",
          state: contactToEdit.state || "",
          postalCode: contactToEdit.postalCode || "",
          country: contactToEdit.country || "",
          notes: contactToEdit.notes || "",
          isPrimary: contactToEdit.isPrimary || false,
          isActive: contactToEdit.isActive !== undefined ? contactToEdit.isActive : true,
        });
      }
    }
  }, [contactId, contacts]);

  // Şirket arama fonksiyonu
  const searchCompanies = useMemo(() => 
    debounce((inputValue: string) => {
      setCompanyInputValue(inputValue);
    }, 300),
  []);

  // Şirket seçimi
  const handleCompanySelect = (id: string) => {
    setContactData(prev => ({ ...prev, companyId: id }));
  };

  // Şirket seçenekleri
  const companyOptions = useMemo(() => {
    if (companyInputValue.length > 0) {
      const searchTerm = companyInputValue.toLowerCase();
      const searchedCompanies = companies
        .filter(company => company.name.toLowerCase().includes(searchTerm))
        .slice(0, 100);

      return [
        { value: "", label: "Seçiniz" },
        ...searchedCompanies.map(company => ({ 
          value: company.id, 
          label: company.name 
        }))
      ];
    }
    
    // Input değeri yoksa, ilk 100 şirketi göster
    return [
      { value: "", label: "Seçiniz" },
      ...companies.slice(0, 100).map(company => ({ 
        value: company.id, 
        label: company.name 
      }))
    ];
  }, [companies, companyInputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setExistingContact(null);

    try {
      // Kişi verilerini API'ye gönder
      const response = await axios.post("/api/main/contacts/createUpdateContact", {
        ...contactData,
        id: contactId,
      });

      if (response.data.success) {
        if (contactId) {
          // Mevcut kişiyi güncelle
          updateContact({
            ...contactData as any,
            id: contactId,
            updatedAt: new Date(),
          });

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Kişi bilgileri güncellendi",
            variant: "default",
          });
        } else {
          // Yeni ID ile kişi nesnesini oluştur
          const newContact = {
            ...contactData as any,
            id: response.data.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
          };

          // Store'a ekle
          addContact(newContact);

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Yeni kişi oluşturuldu",
            variant: "default",
          });
        }

        // Sekmeyi kapat ve kişi listesine dön
        const tabId = contactId ? `edit-contact-${contactId}` : "Yeni Kişi";
        // Tüm sekmeleri kontrol et ve doğru sekmeyi bul
        const allTabs = useTabStore.getState().tabs;
        // Kişi ID'sine göre sekmeyi bul (edit-contact ile başlayan)
        if (contactId) {
          const tabToRemove = allTabs.find((tab) => tab.id.includes(`-${contactId}`));
          if (tabToRemove) {
            removeTab(tabToRemove.id);
          } else {
            removeTab(tabId); // Yine de orijinal ID ile dene
          }
        } else {
          // Yeni kişi sekmesini kapat
          removeTab(tabId);
        }

        setActiveTab("Kişiler");
      } else {
        setError(response.data.message || "Kişi kaydedilirken bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      
      // Çakışma hatası kontrolü (409 Conflict)
      if (error.response?.status === 409) {
        setError(error.response.data.message || "Bu bilgiler ile kayıtlı bir kişi zaten mevcut");
        
        // Var olan kişi bilgilerini sakla
        setExistingContact(error.response.data.existingContact);
      } else {
        setError(error.response?.data?.message || error.message || "Beklenmeyen bir hata oluştu");
      }
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
          
          {/* Basit bir uyarı mesajı */}
          {existingContact && (
            <div className="mt-2 text-sm">
              <p>Bu kişi zaten kayıtlı. Lütfen farklı e-posta veya telefon numarası kullanın.</p>
            </div>
          )}
        </Alert>
      )}

      <ScrollArea className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-6 pb-24">
          {/* Kişi Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Kişi Bilgileri
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel kişi bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Ad</Label>
                  <Input
                    value={contactData.firstName || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Kişinin adı"
                  />
                </div>
                <div>
                  <Label>Soyad</Label>
                  <Input
                    value={contactData.lastName || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Kişinin soyadı"
                  />
                </div>
                <div>
                  <Label>Pozisyon</Label>
                  <Input
                    value={contactData.position || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="Kişinin pozisyonu"
                  />
                </div>
                <div>
                  <Label>Firma</Label>
                  <ReactSelect
                    value={contactData.companyId ? { 
                      value: contactData.companyId, 
                      label: companies.find(c => c.id === contactData.companyId)?.name || "Firma seçin" 
                    } : null}
                    onChange={(option: any) => {
                      if (option) {
                        handleCompanySelect(option.value);
                      } else {
                        handleCompanySelect("");
                      }
                    }}
                    options={companyOptions}
                    isDisabled={isLoadingCompanies}
                    placeholder="Firma seçin"
                    noOptionsMessage={() => "Firma bulunamadı"}
                    loadingMessage={() => "Yükleniyor..."}
                    isLoading={isLoadingCompanies}
                    isClearable
                    onInputChange={searchCompanies}
                    filterOption={() => true} // Disable built-in filtering
                    classNames={{
                      control: (state) => 
                        `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                      placeholder: () => "text-muted-foreground",
                      input: () => "text-foreground",
                      option: (state) => 
                        `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                      menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
                    }}
                    components={{
                      LoadingIndicator: () => (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        </div>
                      )
                    }}
                  />
                  {companies.length > 100 && companyInputValue.length === 0 && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Search className="h-3 w-3 mr-1" />
                      <span>Aramak için yazmaya başlayın (toplam {companies.length} firma)</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      value={contactData.email || ""}
                      onChange={(e) => setContactData((prev) => ({ ...prev, email: e.target.value }))}
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
                      value={contactData.phone || ""}
                      onChange={(e) => setContactData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefon numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cep Telefonu</Label>
                  <div className="relative">
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 border border-r-0 border-input rounded-l-md">
                        +90
                      </div>
                      <Input
                        value={(contactData.mobile || "").replace(/^\+90/, "")}
                        onChange={(e) => {
                          // Sadece sayıları kabul et ve +90 ön ekini ekle
                          const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                          setContactData((prev) => ({ ...prev, mobile: `+90${onlyNumbers}` }));
                        }}
                        placeholder="5XX XXX XX XX"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <Label>Birincil Kişi</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={contactData.isPrimary}
                        onCheckedChange={(checked) => setContactData((prev) => ({ ...prev, isPrimary: checked }))}
                      />
                      <span>{contactData.isPrimary ? "Evet" : "Hayır"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label>Aktif</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={true}
                        disabled={false}
                      />
                      <p className="text-gray-500">Kişiyi Pasif Yapmak Kişiler Listesindeki İşlemlerden Silebilirsiniz.</p>
                    </div>
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
                    Kişi adres ve konum bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Adres</Label>
                  <Textarea
                    value={contactData.address || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Kişi adresi"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Input
                    value={contactData.city || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <Label>İlçe/Bölge</Label>
                  <Input
                    value={contactData.state || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="İlçe veya bölge"
                  />
                </div>
                <div>
                  <Label>Posta Kodu</Label>
                  <Input
                    value={contactData.postalCode || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Posta kodu"
                  />
                </div>
                <div>
                  <Label>Ülke</Label>
                  <Input
                    value={contactData.country || ""}
                    onChange={(e) => setContactData((prev) => ({ ...prev, country: e.target.value }))}
                    placeholder="Ülke"
                    defaultValue="Türkiye"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notlar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    Notlar
                  </h3>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                    Kişi ile ilgili özel notlar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label>Özel Notlar</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={contactData.notes || ""}
                      onChange={(e) => setContactData((prev) => ({ ...prev, notes: e.target.value }))}
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
            {isSubmitting ? "Kaydediliyor..." : contactId ? "Kişiyi Güncelle" : "Kişiyi Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
