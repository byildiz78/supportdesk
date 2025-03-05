"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Save, User, Phone, Mail, Building2, FileText, Calendar, Users, Globe, Facebook, Twitter, Link2, CreditCard, Wallet, BadgePercent } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function CreateCustomer() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerData, setCustomerData] = useState({
    // Müşteri Kartı
    name: "",
    fullName: "",
    phone: "",
    taxNumber: "",
    taxOffice: "",
    isActive: true,

    // Adres
    address: "",

    // Diğer Bilgiler
    birthDate: "",
    age: "",
    maritalStatus: "",
    gender: "",
    email: "",
    facebook: "",
    twitter: "",
    website: "",

    // Kredi ve Bakiye Bilgileri
    creditLimit: "",
    creditStatus: "",
    discount: "",
    totalPayment: "0",
    remainingDebt: "0",
    
    // Para Puan Bilgileri
    pointPercentage: "",
    pointStartDate: "",
    earned: "0",
    spent: "0",
    balance: "0",

    // Kart Bilgileri
    customerCard: "",
    cardType: "",
    proximityCardId: "",

    // Müşteri Özel Not
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // API call will be implemented here
      console.log("Form submitted:", customerData)
      
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu')
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
          {/* Müşteri Kartı */}
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
                    Müşteri Kartı
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel müşteri bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Ad</Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Müşteri adı"
                  />
                </div>
                <div>
                  <Label>Tam Ad/Unvan</Label>
                  <Input
                    value={customerData.fullName}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Tam ad veya unvan"
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Telefon numarası"
                  />
                </div>
                <div>
                  <Label>Vergi No</Label>
                  <Input
                    value={customerData.taxNumber}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, taxNumber: e.target.value }))}
                    placeholder="Vergi numarası"
                  />
                </div>
                <div>
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={customerData.taxOffice}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, taxOffice: e.target.value }))}
                    placeholder="Vergi dairesi"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Adres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Adres
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Müşteri adres bilgileri
                  </p>
                </div>
              </div>

              <div>
                <Textarea
                  value={customerData.address}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adres bilgilerini giriniz"
                  className="min-h-[100px]"
                />
              </div>
            </Card>
          </motion.div>

          {/* Diğer Bilgiler */}
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
                    Diğer Bilgiler
                  </h3>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                    Ek müşteri bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label>Doğum Tarihi</Label>
                  <Input
                    type="date"
                    value={customerData.birthDate}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Yaş</Label>
                  <Input
                    value={customerData.age}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Yaş"
                  />
                </div>
                <div>
                  <Label>Medeni Hal</Label>
                  <Select
                    value={customerData.maritalStatus}
                    onValueChange={(value) => setCustomerData(prev => ({ ...prev, maritalStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Bekar</SelectItem>
                      <SelectItem value="married">Evli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cinsiyet</Label>
                  <Select
                    value={customerData.gender}
                    onValueChange={(value) => setCustomerData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <div>
                  <Label>E-Posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="E-posta adresi"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={customerData.facebook}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="Facebook profili"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Twitter</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={customerData.twitter}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="Twitter profili"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Web Sitesi</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={customerData.website}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Web sitesi adresi"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Kredi ve Bakiye Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                    Kredi ve Bakiye Bilgileri
                  </h3>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    Finansal bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Kredi Limiti</Label>
                  <Input
                    type="number"
                    value={customerData.creditLimit}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, creditLimit: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Kredi Durumu</Label>
                  <Select
                    value={customerData.creditStatus}
                    onValueChange={(value) => setCustomerData(prev => ({ ...prev, creditStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="passive">Pasif</SelectItem>
                      <SelectItem value="blocked">Bloke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İndirim Yüzdesi (%)</Label>
                  <Input
                    type="number"
                    value={customerData.discount}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Para Puan Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                  <BadgePercent className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-rose-600 dark:text-rose-400">
                    Para Puan Bilgileri
                  </h3>
                  <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                    Puan ve kazanım bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Para Puanı (%)</Label>
                  <Input
                    type="number"
                    value={customerData.pointPercentage}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, pointPercentage: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Başlangıç</Label>
                  <Input
                    type="date"
                    value={customerData.pointStartDate}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, pointStartDate: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Kart Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400">
                    Kart Bilgileri
                  </h3>
                  <p className="text-sm text-cyan-600/80 dark:text-cyan-400/80">
                    Müşteri kart detayları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Müşteri Kartı</Label>
                  <Input
                    value={customerData.customerCard}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, customerCard: e.target.value }))}
                    placeholder="Kart numarası"
                  />
                </div>
                <div>
                  <Label>Kart Tipi</Label>
                  <Select
                    value={customerData.cardType}
                    onValueChange={(value) => setCustomerData(prev => ({ ...prev, cardType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meal">Yemek Kartı</SelectItem>
                      <SelectItem value="gift">Hediye Kartı</SelectItem>
                      <SelectItem value="corporate">Kurumsal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Proximity Card ID</Label>
                  <Input
                    value={customerData.proximityCardId}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, proximityCardId: e.target.value }))}
                    placeholder="Kart ID"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Müşteri Özel Not */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-violet-600 dark:text-violet-400">
                    Müşteri Özel Not
                  </h3>
                  <p className="text-sm text-violet-600/80 dark:text-violet-400/80">
                    Ek notlar ve açıklamalar
                  </p>
                </div>
              </div>

              <Textarea
                value={customerData.notes}
                onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Müşteri ile ilgili özel notlarınızı buraya girebilirsiniz..."
                className="min-h-[150px]"
              />
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
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  )
}