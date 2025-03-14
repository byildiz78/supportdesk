"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { User } from "lucide-react"

interface ContactFormProps {
  companyId: string
  contactId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactPosition: string
  onContactIdChange: (value: string) => void
  onContactNameChange: (value: string) => void
  onContactEmailChange: (value: string) => void
  onContactPhoneChange: (value: string) => void
  onContactPositionChange: (value: string) => void
}

export default function ContactForm({
  companyId,
  contactId,
  contactName,
  contactEmail,
  contactPhone,
  contactPosition,
  onContactIdChange,
  onContactNameChange,
  onContactEmailChange,
  onContactPhoneChange,
  onContactPositionChange
}: ContactFormProps) {
  // Mock contacts data - in a real app, you would fetch these based on the companyId
  const contactsByCompany: Record<string, Array<{id: string, firstName: string, lastName: string, email: string, phone: string, position: string}>> = {
    "c1": [
      { id: "ct1", firstName: "Ahmet", lastName: "Yılmaz", email: "ahmet@firmaA1.com", phone: "555-1234", position: "Müdür" },
      { id: "ct2", firstName: "Ayşe", lastName: "Kaya", email: "ayse@firmaA1.com", phone: "555-5678", position: "Teknisyen" }
    ],
    "c2": [
      { id: "ct3", firstName: "Mehmet", lastName: "Demir", email: "mehmet@firmaA2.com", phone: "555-9012", position: "Direktör" },
      { id: "ct4", firstName: "Fatma", lastName: "Şahin", email: "fatma@firmaA2.com", phone: "555-3456", position: "Uzman" }
    ],
    "c3": [
      { id: "ct5", firstName: "Ali", lastName: "Öztürk", email: "ali@firmaB1.com", phone: "555-7890", position: "Yönetici" },
      { id: "ct6", firstName: "Zeynep", lastName: "Çelik", email: "zeynep@firmaB1.com", phone: "555-1122", position: "Asistan" }
    ]
  }

  const contacts = companyId ? contactsByCompany[companyId] || [] : []

  const handleContactSelect = (id: string) => {
    onContactIdChange(id)
    const contact = contacts.find(c => c.id === id)
    if (contact) {
      onContactNameChange(`${contact.firstName} ${contact.lastName}`)
      onContactEmailChange(contact.email)
      onContactPhoneChange(contact.phone)
      onContactPositionChange(contact.position)
    }
  }

  return (
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
          <div className="md:col-span-2">
            <Label>İletişim Kişisi</Label>
            <Select
              value={contactId}
              onValueChange={handleContactSelect}
              disabled={!companyId}
            >
              <SelectTrigger>
                <SelectValue placeholder={companyId ? "İletişim kişisi seçin" : "Önce firma seçin"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seçiniz</SelectItem>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {`${contact.firstName} ${contact.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contactId && (
            <>
              <div>
                <Label>İsim</Label>
                <Input
                  value={contactName}
                  onChange={(e) => onContactNameChange(e.target.value)}
                  placeholder="İsim"
                  disabled
                />
              </div>
              <div>
                <Label>Pozisyon</Label>
                <Input
                  value={contactPosition}
                  onChange={(e) => onContactPositionChange(e.target.value)}
                  placeholder="Pozisyon"
                  disabled
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => onContactEmailChange(e.target.value)}
                  placeholder="E-posta adresi"
                  disabled
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => onContactPhoneChange(e.target.value)}
                  placeholder="Telefon numarası"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
