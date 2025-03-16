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
import { Save, User, Building, Mail, Phone, MapPin, Briefcase, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useContactsStore, Contact } from "@/stores/main/contacts-store"
import { useCompaniesStore } from "@/stores/main/companies-store"
import { useTabStore } from "@/stores/tab-store"
import { useFilterStore } from "@/stores/filters-store"
import { toast } from "@/components/ui/toast/use-toast"
import axios from "@/lib/axios"
import { Switch } from "@/components/ui/switch"

interface CreateContactProps {
  contactId?: string;
  companyId?: string | null;
}

export default function CreateContact({ contactId, companyId }: CreateContactProps) {
  const { removeTab, setActiveTab } = useTabStore()
  const { selectedFilter } = useFilterStore()
  const { addContact, updateContact, contacts } = useContactsStore()
  const { companies, setCompanies } = useCompaniesStore()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactData, setContactData] = useState<Partial<Contact>>({
    firstName: "",
    lastName: "",
    companyId: companyId || "",
    position: "",
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
    isActive: true
  })

  // If edit mode, load existing contact data
  useEffect(() => {
    if (contactId) {
      // Get contact data from store
      const contactToEdit = contacts.find(c => c.id === contactId)
      
      if (contactToEdit) {
        setContactData({
          ...contactToEdit
        })
      }
    }
  }, [contactId, contacts])

  // Load companies for dropdown if not already loaded
  useEffect(() => {
    const fetchCompanies = async () => {
      if (companies.length === 0) {
        try {
          // Handle selected branches
          let branchParam = selectedFilter.selectedBranches.length > 0
            ? selectedFilter.selectedBranches
            : selectedFilter.branches

          // Prepare value for API
          if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
            // Send empty array, not null
            branchParam = []
          }
          
          const response = await axios.post('/api/main/companies/companiesList', {
            tenantId: branchParam
          })
          
          if (response.data) {
            setCompanies(response.data)
          }
        } catch (error) {
          console.error('Error loading companies:', error)
        }
      }
    }

    fetchCompanies()
  }, [companies.length, setCompanies, selectedFilter.branches, selectedFilter.selectedBranches])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Send contact data to API
      // Handle selected branches
      let branchParam = selectedFilter.selectedBranches.length > 0
        ? selectedFilter.selectedBranches
        : selectedFilter.branches

      // Prepare value for API
      if (!branchParam || (Array.isArray(branchParam) && branchParam.length === 0)) {
        // Send empty array, not null
        branchParam = []
      }

      const response = await axios.post('/api/main/contacts/createUpdateContact', {
        ...contactData,
        id: contactId,
        tenantId: branchParam
      })

      if (response.data.success) {
        if (contactId) {
          // Update existing contact
          updateContact({
            ...contactData as any,
            id: contactId,
            updatedAt: new Date()
          })

          // Show success message
          toast({
            title: "Başarılı",
            description: "Kişi bilgileri güncellendi",
            variant: "default",
          })
        } else {
          // Create new contact object with new ID
          const newContact: Contact = {
            ...contactData as any,
            id: response.data.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
          }

          // Add to store
          addContact(newContact)

          // Show success message
          toast({
            title: "Başarılı",
            description: "Yeni kişi oluşturuldu",
            variant: "default",
          })
        }

        // Close tab and return to contacts list
        const tabId = contactId ? `edit-contact-${contactId}` : 'Yeni Kişi'
        // Check all tabs and find the correct one
        const allTabs = useTabStore.getState().tabs
        // Find tab by contact ID (starting with edit-contact)
        if (contactId) {
          const tabToRemove = allTabs.find(tab => tab.id.includes(`-${contactId}`))
          if (tabToRemove) {
            removeTab(tabToRemove.id)
          } else {
            removeTab(tabId) // Try with original ID
          }
        } else {
          // Close new contact tab
          removeTab(tabId)
        }
        
        setActiveTab('Kişiler')
      } else {
        setError(response.data.message || 'Kişi kaydedilirken bir hata oluştu')
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
          {/* Kişisel Bilgiler */}
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
                    Kişisel Bilgiler
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
                    onChange={(e) => setContactData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Ad"
                  />
                </div>
                <div>
                  <Label>Soyad</Label>
                  <Input
                    value={contactData.lastName || ""}
                    onChange={(e) => setContactData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Soyad"
                  />
                </div>
                <div>
                  <Label>Firma</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Select
                      value={contactData.companyId || ""}
                      onValueChange={(value) => setContactData(prev => ({ ...prev, companyId: value }))}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Firma seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Firma yok</SelectItem>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Pozisyon</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={contactData.position || ""}
                      onChange={(e) => setContactData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Pozisyon veya ünvan"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      value={contactData.email || ""}
                      onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
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
                      onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefon numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cep Telefonu</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={contactData.mobile || ""}
                      onChange={(e) => setContactData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Cep telefonu numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex-1">
                    <Label>Birincil Kişi</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch 
                        checked={contactData.isPrimary} 
                        onCheckedChange={(checked) => setContactData(prev => ({ ...prev, isPrimary: checked }))}
                      />
                      <span>{contactData.isPrimary ? "Evet" : "Hayır"}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label>Aktif</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch 
                        checked={contactData.isActive} 
                        onCheckedChange={(checked) => setContactData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <span>{contactData.isActive ? "Aktif" : "Pasif"}</span>
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
                    onChange={(e) => setContactData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adres"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Şehir</Label>
                  <Input
                    value={contactData.city || ""}
                    onChange={(e) => setContactData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <Label>İlçe/Bölge</Label>
                  <Input
                    value={contactData.state || ""}
                    onChange={(e) => setContactData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="İlçe veya bölge"
                  />
                </div>
                <div>
                  <Label>Posta Kodu</Label>
                  <Input
                    value={contactData.postalCode || ""}
                    onChange={(e) => setContactData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Posta kodu"
                  />
                </div>
                <div>
                  <Label>Ülke</Label>
                  <Input
                    value={contactData.country || ""}
                    onChange={(e) => setContactData(prev => ({ ...prev, country: e.target.value }))}
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
                      onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
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
  )
}
