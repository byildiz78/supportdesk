"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Save, Building, Building2, Mail, Phone, Hash, FileText, Globe, MapPin, Briefcase, Calendar, FileCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useCompaniesStore } from "@/stores/main/companies-store"
import { Company } from "@/stores/main/companies-store"
import { useTabStore } from "@/stores/tab-store"
import { useFilterStore } from "@/stores/filters-store"
import { toast } from "@/components/ui/toast/use-toast"
import axios from "@/lib/axios"
import { Switch } from "@/components/ui/switch"

interface CreateCompanyProps {
  companyId?: string;
}

export default function CreateCompany({ companyId }: CreateCompanyProps) {
  const { removeTab, setActiveTab } = useTabStore()
  const { selectedFilter } = useFilterStore()
  const { addCompany, updateCompany, companies } = useCompaniesStore()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parentCompanies, setParentCompanies] = useState<{id: string, name: string}[]>([])
  const [companyData, setCompanyData] = useState<Partial<Company>>({
    name: "",
    parentCompanyId: "",
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
    flow_ba_starting_date: "",
    flow_ba_end_date: "",
    flow_ba_notes: "",
    flow_support_notes: "",
    flow_licence_notes: ""
  })

  // Eğer düzenleme modu ise, mevcut şirket verilerini form'a doldur
  useEffect(() => {
    if (companyId) {
      // Store'dan şirket verilerini al
      const companyToEdit = companies.find(c => c.id === companyId)
      
      if (companyToEdit) {
        // ISO tarih formatını YYYY-MM-DD formatına dönüştür
        const formatDateForInput = (dateString: string | undefined) => {
          if (!dateString) return "";
          
          try {
            const date = new Date(dateString);
            
            // Geçersiz tarih kontrolü
            if (isNaN(date.getTime())) return "";
            
            // YYYY-MM-DD formatına dönüştür
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error("Date formatting error:", error);
            return "";
          }
        };

        setCompanyData({
          ...companyToEdit,
          flow_ba_starting_date: formatDateForInput(companyToEdit.flow_ba_starting_date),
          flow_ba_end_date: formatDateForInput(companyToEdit.flow_ba_end_date)
        })
      }
    }
  }, [companyId, companies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Şirket verilerini API'ye gönder
      const response = await axios.post('/api/main/companies/createUpdateCompany', {
        ...companyData,
        id: companyId,
        tenantId: selectedFilter?.branchParam
      })

      if (response.data.success) {
        if (companyId) {
          // Mevcut şirketi güncelle
          updateCompany({
            ...companyData as any,
            id: companyId,
            updatedAt: new Date()
          })

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Firma bilgileri güncellendi",
            variant: "default",
          })
        } else {
          // Yeni ID ile şirket nesnesini oluştur
          const newCompany: Company = {
            ...companyData as any,
            id: response.data.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
          }

          // Store'a ekle
          addCompany(newCompany)

          // Başarılı mesajı göster
          toast({
            title: "Başarılı",
            description: "Yeni firma oluşturuldu",
            variant: "default",
          })
        }

        // Sekmeyi kapat ve firma listesine dön
        const tabId = companyId ? `edit-company-${companyId}` : 'Yeni Şirket'
        // Tüm sekmeleri kontrol et ve doğru sekmeyi bul
        const allTabs = useTabStore.getState().tabs
        // Şirket ID'sine göre sekmeyi bul (edit-company ile başlayan)
        if (companyId) {
          const tabToRemove = allTabs.find(tab => tab.id.includes(`-${companyId}`))
          if (tabToRemove) {
            removeTab(tabToRemove.id)
          } else {
            removeTab(tabId) // Yine de orijinal ID ile dene
          }
        } else {
          // Yeni şirket sekmesini kapat
          removeTab(tabId)
        }
        
        setActiveTab('Firmalar')
      } else {
        setError(response.data.message || 'Firma kaydedilirken bir hata oluştu')
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setError(error.response?.data?.message || error.message || 'Beklenmeyen bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          {/* Firma Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Firma Bilgileri
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel firma bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Firma Adı</Label>
                  <Input
                    value={companyData.name || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Firma adı"
                  />
                </div>
                <div>
                  <Label>Ana Firma</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Select
                      value={companyData.parentCompanyId || ""}
                      onValueChange={(value) => setCompanyData(prev => ({ ...prev, parentCompanyId: value }))}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Ana firma seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ana firma yok</SelectItem>
                        {parentCompanies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Vergi No</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={companyData.taxId || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="Vergi numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={companyData.taxOffice || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, taxOffice: e.target.value }))}
                    placeholder="Vergi dairesi"
                  />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      value={companyData.email || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
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
                      value={companyData.phone || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
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
                      value={companyData.website || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website adresi"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Aktif</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch 
                      checked={companyData.isActive} 
                      onCheckedChange={(checked) => setCompanyData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span>{companyData.isActive ? "Aktif" : "Pasif"}</span>
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
                    Firma adres ve konum bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Adres</Label>
                  <Textarea
                    value={companyData.address || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Firma adresi"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Input
                    value={companyData.city || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <Label>İlçe/Bölge</Label>
                  <Input
                    value={companyData.state || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="İlçe veya bölge"
                  />
                </div>
                <div>
                  <Label>Posta Kodu</Label>
                  <Input
                    value={companyData.postalCode || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Posta kodu"
                  />
                </div>
                <div>
                  <Label>Ülke</Label>
                  <Input
                    value={companyData.country || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
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
                    Firma ile ilgili diğer bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Sektör</Label>
                  <Input
                    value={companyData.industry || ""}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Firmanın faaliyet gösterdiği sektör"
                  />
                </div>
                <div>
                  <Label>Firma Türü</Label>
                  <Select
                    value={companyData.companyType || ""}
                    onValueChange={(value) => setCompanyData(prev => ({ ...prev, companyType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Firma türünü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limited">Limited Şirket</SelectItem>
                      <SelectItem value="anonim">Anonim Şirket</SelectItem>
                      <SelectItem value="sahis">Şahıs Şirketi</SelectItem>
                      <SelectItem value="kamu">Kamu Kurumu</SelectItem>
                      <SelectItem value="diger">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Özel Notlar</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={companyData.notes || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Özel notlar"
                      className="min-h-[100px] pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Flow Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                    Flow Bilgileri
                  </h3>
                  <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">
                    Flow entegrasyonu için gerekli bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>BA Başlangıç Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      value={companyData.flow_ba_starting_date || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, flow_ba_starting_date: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>BA Bitiş Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      value={companyData.flow_ba_end_date || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, flow_ba_end_date: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>BA Notları</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={companyData.flow_ba_notes || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, flow_ba_notes: e.target.value }))}
                      placeholder="BA ile ilgili notlar"
                      className="min-h-[100px] pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Destek Notları</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={companyData.flow_support_notes || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, flow_support_notes: e.target.value }))}
                      placeholder="Destek ile ilgili notlar"
                      className="min-h-[100px] pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Lisans Notları</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={companyData.flow_licence_notes || ""}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, flow_licence_notes: e.target.value }))}
                      placeholder="Lisans ile ilgili notlar"
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
            {isSubmitting ? "Kaydediliyor..." : companyId ? "Firmayı Güncelle" : "Firmayı Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  )
}