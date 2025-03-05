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
import { Save, User, Target, Settings, BadgePercent, Wallet, Tag } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function CreateCustomer() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [segmentData, setSegmentData] = useState({
    // Segment Bilgileri
    name: "",
    code: "",
    description: "",
    isActive: true,

    // Segment Kriterleri
    criteria: {
      minSpendAmount: "",
      maxSpendAmount: "",
      minVisitCount: "",
      maxVisitCount: "",
      lastVisitDays: "",
      gender: "",
      minAge: "",
      maxAge: "",
      locationCodes: "",
      includeCategories: "",
      excludeCategories: ""
    },

    // Segment Aksiyonları
    actions: {
      bonusPoints: "",
      discountPercentage: "",
      discountAmount: "",
      includedCategories: "",
      excludedCategories: ""
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // API call will be implemented here
      console.log("Form submitted:", segmentData)
      
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
          {/* Müşteri Segmenti Bilgileri */}
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
                    Müşteri Segmenti Bilgileri
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel segment tanımlamaları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Segment Adı</Label>
                  <Input
                    value={segmentData.name}
                    onChange={(e) => setSegmentData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Müşteri segmenti adı"
                  />
                </div>
                <div>
                  <Label>Segment Kodu</Label>
                  <Input
                    value={segmentData.code}
                    onChange={(e) => setSegmentData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Kod (örn: VIP, ELITE)"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={segmentData.description}
                    onChange={(e) => setSegmentData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Segment açıklaması"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Segment Kriterleri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Segment Kriterleri
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Müşterileri bu segmente dahil etme koşulları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label>Min. Harcama Tutarı (₺)</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.minSpendAmount}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, minSpendAmount: e.target.value} 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Max. Harcama Tutarı (₺)</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.maxSpendAmount}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, maxSpendAmount: e.target.value} 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Min. Ziyaret Sayısı</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.minVisitCount}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, minVisitCount: e.target.value} 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Max. Ziyaret Sayısı</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.maxVisitCount}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, maxVisitCount: e.target.value} 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Son Ziyaret (Gün)</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.lastVisitDays}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, lastVisitDays: e.target.value} 
                    }))}
                    placeholder="Son kaç gün içinde"
                  />
                </div>
                <div>
                  <Label>Cinsiyet</Label>
                  <Select
                    value={segmentData.criteria.gender}
                    onValueChange={(value) => setSegmentData(prev => ({
                      ...prev,
                      criteria: {...prev.criteria, gender: value}
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min. Yaş</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.minAge}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, minAge: e.target.value} 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Max. Yaş</Label>
                  <Input
                    type="number"
                    value={segmentData.criteria.maxAge}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, maxAge: e.target.value} 
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Lokasyon Kodları</Label>
                  <Input
                    value={segmentData.criteria.locationCodes}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, locationCodes: e.target.value} 
                    }))}
                    placeholder="Virgülle ayırın (İST, ANK, ...)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label>Dahil Kategori/Ürünler</Label>
                  <Textarea
                    value={segmentData.criteria.includeCategories}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, includeCategories: e.target.value} 
                    }))}
                    placeholder="Dahil edilecek ürün/kategorileri yazın"
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Hariç Kategori/Ürünler</Label>
                  <Textarea
                    value={segmentData.criteria.excludeCategories}
                    onChange={(e) => setSegmentData(prev => ({ 
                      ...prev, 
                      criteria: {...prev.criteria, excludeCategories: e.target.value} 
                    }))}
                    placeholder="Hariç tutulacak ürün/kategorileri yazın"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Segment Aksiyonları */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                    Segment Aksiyonları
                  </h3>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    Bu segmentteki müşterilere uygulanacak aksiyonlar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Para Puan Yükleme (%)</Label>
                  <div className="relative">
                    <BadgePercent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      type="number"
                      value={segmentData.actions.bonusPoints}
                      onChange={(e) => setSegmentData(prev => ({ 
                        ...prev, 
                        actions: {...prev.actions, bonusPoints: e.target.value} 
                      }))}
                      className="pl-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>İndirim Oranı (%)</Label>
                  <div className="relative">
                    <BadgePercent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      type="number"
                      value={segmentData.actions.discountPercentage}
                      onChange={(e) => setSegmentData(prev => ({ 
                        ...prev, 
                        actions: {...prev.actions, discountPercentage: e.target.value} 
                      }))}
                      className="pl-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>İndirim Tutarı (₺)</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      type="number"
                      value={segmentData.actions.discountAmount}
                      onChange={(e) => setSegmentData(prev => ({ 
                        ...prev, 
                        actions: {...prev.actions, discountAmount: e.target.value} 
                      }))}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label>Dahil Kategori/Ürünler</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-amber-500" />
                    <Textarea
                      value={segmentData.actions.includedCategories}
                      onChange={(e) => setSegmentData(prev => ({ 
                        ...prev, 
                        actions: {...prev.actions, includedCategories: e.target.value} 
                      }))}
                      placeholder="İndirim/puan uygulanacak ürün/kategorileri yazın"
                      className="min-h-[80px] pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Hariç Kategori/Ürünler</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-amber-500" />
                    <Textarea
                      value={segmentData.actions.excludedCategories}
                      onChange={(e) => setSegmentData(prev => ({ 
                        ...prev, 
                        actions: {...prev.actions, excludedCategories: e.target.value} 
                      }))}
                      placeholder="İndirim/puan uygulanmayacak ürün/kategorileri yazın"
                      className="min-h-[80px] pl-10"
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Kaydediliyor..." : "Segmenti Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  )
}