"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Save, Building2, Phone, Mail, MessageSquare, Tag, AlertCircle, Users, User, Briefcase, Paperclip, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTicketStore } from "@/stores/ticket-store"
import { FileAttachment } from "@/types/tickets"

export default function NewTicketPage() {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    companyName: "",
    companyId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",
    source: "web",
    priority: "medium",
    category: "",
    assignedTo: "",
    tags: []
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Convert files to FileAttachment format
      const attachments: FileAttachment[] = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: "current_user"
      }))

      // Create ticket object with attachments
      const newTicket = {
        id: Math.random().toString(36).substring(7),
        title: ticketData.title,
        description: ticketData.description,
        status: "open",
        priority: ticketData.priority,
        source: ticketData.source,
        category: ticketData.category,
        assignedTo: ticketData.assignedTo,
        customerName: ticketData.contactName,
        customerEmail: ticketData.contactEmail,
        customerPhone: ticketData.contactPhone,
        createdBy: "current_user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments,
        comments: []
      }

      // Add ticket to store
      useTicketStore.getState().addTicket(newTicket)
      
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
          {/* Talep Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Talep Bilgileri
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Temel talep detayları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Başlık</Label>
                  <Input
                    value={ticketData.title}
                    onChange={(e) => setTicketData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Talep başlığı"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={ticketData.description}
                    onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Talep açıklaması"
                    className="min-h-[120px]"
                  />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={ticketData.category}
                    onValueChange={(value) => setTicketData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Teknik Destek</SelectItem>
                      <SelectItem value="billing">Fatura/Ödeme</SelectItem>
                      <SelectItem value="account">Hesap İşlemleri</SelectItem>
                      <SelectItem value="general">Genel Sorular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Öncelik</Label>
                  <Select
                    value={ticketData.priority}
                    onValueChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="urgent">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Dosya Ekle</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        type="button"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Dosya Seç
                      </Button>
                    </div>

                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md group"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm max-w-[200px] truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Firma Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Firma Bilgileri
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Firma detayları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Firma Adı</Label>
                  <Input
                    value={ticketData.companyName}
                    onChange={(e) => setTicketData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Firma adı"
                  />
                </div>
                <div>
                  <Label>Firma ID</Label>
                  <Input
                    value={ticketData.companyId}
                    onChange={(e) => setTicketData(prev => ({ ...prev, companyId: e.target.value }))}
                    placeholder="Firma ID"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* İletişim Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <User className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                    İletişim Bilgileri
                  </h3>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    İletişim kurulacak kişi bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>İletişim Adı</Label>
                  <Input
                    value={ticketData.contactName}
                    onChange={(e) => setTicketData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="İletişim adı"
                  />
                </div>
                <div>
                  <Label>Pozisyon</Label>
                  <Input
                    value={ticketData.contactPosition}
                    onChange={(e) => setTicketData(prev => ({ ...prev, contactPosition: e.target.value }))}
                    placeholder="Pozisyon"
                  />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    value={ticketData.contactEmail}
                    onChange={(e) => setTicketData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="E-posta adresi"
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={ticketData.contactPhone}
                    onChange={(e) => setTicketData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Telefon numarası"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Atama Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    Atama Bilgileri
                  </h3>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                    Talebin atanacağı kişi ve etiketler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Atanan Kişi</Label>
                  <Select
                    value={ticketData.assignedTo}
                    onValueChange={(value) => setTicketData(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent1">Destek Uzmanı 1</SelectItem>
                      <SelectItem value="agent2">Destek Uzmanı 2</SelectItem>
                      <SelectItem value="agent3">Destek Uzmanı 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kaynak</Label>
                  <Select
                    value={ticketData.source}
                    onValueChange={(value) => setTicketData(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kaynak seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-posta</SelectItem>
                      <SelectItem value="phone">Telefon</SelectItem>
                      <SelectItem value="web">Web Sitesi</SelectItem>
                      <SelectItem value="chat">Canlı Destek</SelectItem>
                    </SelectContent>
                  </Select>
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
            {isSubmitting ? "Kaydediliyor..." : "Talebi Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  )
}