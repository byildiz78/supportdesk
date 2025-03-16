"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Loader2, User } from "lucide-react"
import { useEffect, useState } from "react"
import { ContactService, Contact } from "../../contacts/services/contact-service"

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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoadingContacts(true)
      try {
        console.log('İletişim kişileri yükleniyor, companyId:', companyId)
        
        // ContactService kullanarak firmaya ait kişileri getir
        const contactsData = await ContactService.getContactsByCompanyId(companyId)
        console.log('İletişim kişileri başarıyla yüklendi:', contactsData.length)
        setContacts(contactsData)
      } catch (error) {
        console.error('İletişim kişileri yüklenirken hata oluştu:', error)
        setContacts([])
      } finally {
        setIsLoadingContacts(false)
      }
    }

    if (companyId) {
      fetchContacts()
    } else {
      setContacts([])
    }
  }, [companyId])

  const handleContactSelect = (id: string) => {
    onContactIdChange(id)
    const contact = contacts.find(c => c.id === id)
    if (contact) {
      onContactNameChange(`${contact.first_name} ${contact.last_name}`)
      onContactEmailChange(contact.email || "")
      onContactPhoneChange(contact.phone || "")
      onContactPositionChange(contact.position || "")
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
              disabled={!companyId || isLoadingContacts}
            >
              <SelectTrigger>
                {isLoadingContacts ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={companyId ? "İletişim kişisi seçin" : "Önce firma seçin"} />
                )}
              </SelectTrigger>
              <SelectContent>
                {contacts.length > 0 ? (
                  contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {`${contact.first_name} ${contact.last_name}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {companyId ? "Bu firmaya ait kişi bulunamadı" : "Önce firma seçin"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>E-posta</Label>
            <Input
              value={contactEmail}
              onChange={(e) => onContactEmailChange(e.target.value)}
              placeholder="E-posta adresi"
            />
          </div>

          <div>
            <Label>Telefon</Label>
            <Input
              value={contactPhone}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder="Telefon numarası"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Pozisyon</Label>
            <Input
              value={contactPosition}
              onChange={(e) => onContactPositionChange(e.target.value)}
              placeholder="Pozisyon/Unvan"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
