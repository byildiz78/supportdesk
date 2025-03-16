"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Building2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { CompanyService, Company } from "../../companies/services/company-service"
import { ContactService, Contact } from "../../contacts/services/contact-service"
import axios from 'axios';

interface CompanyFormProps {
  parentCompanyId?: string
  companyId: string
  companyName: string
  contactId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactPosition: string
  onCompanyIdChange: (value: string) => void
  onCompanyNameChange: (value: string) => void
  onContactIdChange: (value: string) => void
  onContactNameChange: (value: string) => void
  onContactEmailChange: (value: string) => void
  onContactPhoneChange: (value: string) => void
  onContactPositionChange: (value: string) => void
}

export default function CompanyForm({
  parentCompanyId = "",
  companyId,
  companyName,
  contactId,
  contactName,
  contactEmail,
  contactPhone,
  contactPosition,
  onCompanyIdChange,
  onCompanyNameChange,
  onContactIdChange,
  onContactNameChange,
  onContactEmailChange,
  onContactPhoneChange,
  onContactPositionChange
}: CompanyFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Firmaları yükle
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        console.log('Firmalar yükleniyor, parentCompanyId:', parentCompanyId);
        
        // CompanyService kullanarak firmaları getir
        const companiesData = await CompanyService.getCompanies(parentCompanyId || undefined);
        console.log('Firmalar başarıyla yüklendi:', companiesData.length);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Firmalar yüklenirken hata oluştu:', error);
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [parentCompanyId]);

  // Tüm iletişim kişilerini yükle (bağımsız olarak)
  useEffect(() => {
    const fetchAllContacts = async () => {
      setIsLoadingContacts(true);
      try {
        // ContactService kullanarak tüm kişileri getir
        const contactsData = await ContactService.getContacts();
        console.log('İletişim kişileri başarıyla yüklendi:', contactsData.length);
        setContacts(contactsData);
      } catch (error) {
        console.error('İletişim kişileri yüklenirken hata oluştu:', error);
        setContacts([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchAllContacts();
  }, []);

  const handleCompanySelect = (id: string) => {
    onCompanyIdChange(id);
    const company = companies.find(c => c.id === id);
    if (company) {
      onCompanyNameChange(company.name);
    }
  };

  const handleContactSelect = (id: string) => {
    onContactIdChange(id);
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      onContactNameChange(contact.name);
      onContactEmailChange(contact.email || "");
      onContactPhoneChange(contact.phone || "");
      onContactPositionChange(contact.position || "");
      
      // İletişim kişisi seçildiğinde, ilgili firmayı da otomatik olarak seçebiliriz
      // Ancak bu isteğe bağlı, kullanıcı isterse farklı bir firma seçebilir
      if (contact.company_id && !companyId) {
        onCompanyIdChange(contact.company_id);
        onCompanyNameChange(contact.company_name || "");
      }
    }
  };

  return (
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
              Firma ve iletişim detayları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Firma</Label>
            <Select
              value={companyId}
              onValueChange={handleCompanySelect}
              disabled={isLoadingCompanies}
            >
              <SelectTrigger>
                {isLoadingCompanies ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Firma seçin" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seçiniz</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>İletişim Kişisi</Label>
            <Select
              value={contactId}
              onValueChange={handleContactSelect}
              disabled={isLoadingContacts}
            >
              <SelectTrigger>
                {isLoadingContacts ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="İletişim kişisi seçin" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seçiniz</SelectItem>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} {contact.company_name ? `(${contact.company_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {contactId && (
            <>
              <div>
                <Label>İletişim Kişisi Adı</Label>
                <Input
                  value={contactName}
                  onChange={(e) => onContactNameChange(e.target.value)}
                  placeholder="İletişim kişisi adı"
                  disabled
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  value={contactEmail}
                  onChange={(e) => onContactEmailChange(e.target.value)}
                  placeholder="E-posta"
                  disabled
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => onContactPhoneChange(e.target.value)}
                  placeholder="Telefon"
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
            </>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
