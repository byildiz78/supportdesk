"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Loader2, User } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useContacts } from "@/providers/contacts-provider"
import ReactSelect from "react-select"

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
  // ContactsProvider'dan tüm kişileri al
  const { contacts, loading: isLoadingContacts } = useContacts();
  
  // Şirket ID'sine göre kişileri filtrele
  const filteredContacts = useMemo(() => {
    if (!companyId) return [];
    
    return contacts.filter(contact => {
      const contactCompanyId = contact.companyId || contact.company_id;
      return contactCompanyId === companyId;
    });
  }, [contacts, companyId]);

  const handleContactSelect = (id: string) => {
    onContactIdChange(id);
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      // İsim için hem yeni hem eski alan adlarını kontrol et
      const firstName = contact.firstName || contact.first_name || '';
      const lastName = contact.lastName || contact.last_name || '';
      const contactName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
      
      onContactNameChange(contactName);
      onContactEmailChange(contact.email || "");
      onContactPhoneChange(contact.phone || "");
      onContactPositionChange(contact.position || "");
    }
  };

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
            <ReactSelect
              value={contactId ? { 
                value: contactId, 
                label: (() => {
                  const contact = contacts.find(c => c.id === contactId);
                  if (contact) {
                    const firstName = contact.firstName || contact.first_name || '';
                    const lastName = contact.lastName || contact.last_name || '';
                    return contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
                  }
                  return "İletişim kişisi seçin";
                })()
              } : null}
              onChange={(option: any) => {
                if (option) {
                  handleContactSelect(option.value);
                } else {
                  handleContactSelect("");
                }
              }}
              options={filteredContacts.map(contact => {
                const firstName = contact.firstName || contact.first_name || '';
                const lastName = contact.lastName || contact.last_name || '';
                const contactName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
                
                return {
                  value: contact.id,
                  label: contactName
                };
              })}
              isDisabled={!companyId || isLoadingContacts}
              placeholder={companyId ? "İletişim kişisi seçin" : "Önce firma seçin"}
              noOptionsMessage={() => companyId ? "Bu firmaya ait kişi bulunamadı" : "Önce firma seçin"}
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingContacts}
              isClearable
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
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )
              }}
            />
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
