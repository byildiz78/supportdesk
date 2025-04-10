"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Save, User, Mail, Phone, Hash, FileText, Briefcase } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function NewContactPage() {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactData, setContactData] = useState({
    name: "",
    title: "",
    phone: "",
    email: "",
    flowId: "",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      
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
                  <Label>Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={contactData.name}
                      onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ad soyad"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Ünvan</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={contactData.title}
                      onChange={(e) => setContactData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ünvan"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Flow ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      value={contactData.flowId}
                      onChange={(e) => setContactData(prev => ({ ...prev, flowId: e.target.value }))}
                      placeholder="Flow ID"
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
                      value={contactData.email}
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
                      value={contactData.phone}
                      onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefon numarası"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Özel Notlar</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Textarea
                      value={contactData.notes}
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
            {isSubmitting ? "Kaydediliyor..." : "Kişiyi Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  )
}