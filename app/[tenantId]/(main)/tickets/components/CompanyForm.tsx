"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Building2, Loader2, Search } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useCompanies } from "@/providers/companies-provider"
import { useContacts } from "@/providers/contacts-provider"
import ReactSelect from "react-select"
import { debounce } from "lodash"

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
  // Provider'lardan veri al
  const { companies, loading: isLoadingCompanies } = useCompanies();
  const { contacts, loading: isLoadingContacts } = useContacts();
  
  // Filtrelenmiş şirketler
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [companyInputValue, setCompanyInputValue] = useState("");
  const [contactInputValue, setContactInputValue] = useState("");
  
  // Arama için filtrelenmiş şirketler
  const [searchedCompanies, setSearchedCompanies] = useState<any[]>([]);
  const [searchedContacts, setSearchedContacts] = useState<any[]>([]);

  // parentCompanyId değiştiğinde şirketleri filtrele
  useEffect(() => {
    if (parentCompanyId) {
      const filtered = companies.filter(company => 
        company.parentCompanyId === parentCompanyId
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [companies, parentCompanyId]);

  // Şirket seçimi
  const handleCompanySelect = (id: string) => {
    onCompanyIdChange(id);
    const company = companies.find(c => c.id === id);
    if (company) {
      onCompanyNameChange(company.name);
    }
  };

  // İletişim kişisi seçimi
  const handleContactSelect = (id: string) => {
    onContactIdChange(id);
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      // İsim için hem yeni hem eski alan adlarını kontrol et
      const firstName = contact.firstName || contact.first_name || '';
      const lastName = contact.lastName || contact.last_name || '';
      const fullName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
      
      onContactNameChange(fullName);
      onContactEmailChange(contact.email || "");
      onContactPhoneChange(contact.phone || "");
      onContactPositionChange(contact.position || "");
      
      // İletişim kişisi seçildiğinde, ilgili firmayı da otomatik olarak seçebiliriz
      // Ancak bu isteğe bağlı, kullanıcı isterse farklı bir firma seçebilir
      const contactCompanyId = contact.companyId || contact.company_id;
      if (contactCompanyId && !companyId) {
        onCompanyIdChange(contactCompanyId);
        const company = companies.find(c => c.id === contactCompanyId);
        if (company) {
          onCompanyNameChange(company.name || "");
        }
      }
    }
  };

  // Şirket arama fonksiyonu
  const searchCompanies = useMemo(() => 
    debounce((inputValue: string) => {
      if (!inputValue) {
        setSearchedCompanies([]);
        return;
      }
      
      const searchTerm = inputValue.toLowerCase();
      const results = filteredCompanies
        .filter(company => 
          company.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 100); // Sadece ilk 100 sonucu göster
      
      setSearchedCompanies(results);
    }, 300),
  [filteredCompanies]);

  // Kişi arama fonksiyonu
  const searchContacts = useMemo(() => 
    debounce((inputValue: string) => {
      if (!inputValue) {
        setSearchedContacts([]);
        return;
      }
      
      const searchTerm = inputValue.toLowerCase();
      const results = contacts
        .filter(contact => {
          const firstName = contact.firstName || contact.first_name || '';
          const lastName = contact.lastName || contact.last_name || '';
          const contactName = contact.name || `${firstName} ${lastName}`.trim() || "";
          const companyName = contact.companyName || '';
          
          return contactName.toLowerCase().includes(searchTerm) || 
                 companyName.toLowerCase().includes(searchTerm);
        })
        .slice(0, 100); // Sadece ilk 100 sonucu göster
      
      setSearchedContacts(results);
    }, 300),
  [contacts]);

  // Şirket input değeri değiştiğinde
  const handleCompanyInputChange = (inputValue: string) => {
    setCompanyInputValue(inputValue);
    searchCompanies(inputValue);
  };

  // Kişi input değeri değiştiğinde
  const handleContactInputChange = (inputValue: string) => {
    setContactInputValue(inputValue);
    searchContacts(inputValue);
  };

  // Şirket seçenekleri
  const companyOptions = useMemo(() => {
    if (companyInputValue.length > 0) {
      return [
        { value: "", label: "Seçiniz" },
        ...searchedCompanies.map(company => ({ 
          value: company.id, 
          label: company.name 
        }))
      ];
    }
    
    // Input değeri yoksa, ilk 100 şirketi göster
    return [
      { value: "", label: "Seçiniz" },
      ...filteredCompanies.slice(0, 100).map(company => ({ 
        value: company.id, 
        label: company.name 
      }))
    ];
  }, [filteredCompanies, searchedCompanies, companyInputValue]);

  // Kişi seçenekleri
  const contactOptions = useMemo(() => {
    if (contactInputValue.length > 0) {
      return [
        { value: "", label: "Seçiniz" },
        ...searchedContacts.map(contact => {
          const firstName = contact.firstName || contact.first_name || '';
          const lastName = contact.lastName || contact.last_name || '';
          const contactName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
          const companyName = contact.companyName || '';
          
          return {
            value: contact.id,
            label: `${contactName} ${companyName ? `(${companyName})` : ''}`
          };
        })
      ];
    }
    
    // Input değeri yoksa, ilk 100 kişiyi göster
    return [
      { value: "", label: "Seçiniz" },
      ...contacts.slice(0, 100).map(contact => {
        const firstName = contact.firstName || contact.first_name || '';
        const lastName = contact.lastName || contact.last_name || '';
        const contactName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
        const companyName = contact.companyName || '';
        
        return {
          value: contact.id,
          label: `${contactName} ${companyName ? `(${companyName})` : ''}`
        };
      })
    ];
  }, [contacts, searchedContacts, contactInputValue]);

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
            <ReactSelect
              value={companyId ? { 
                value: companyId, 
                label: companies.find(c => c.id === companyId)?.name || "Firma seçin" 
              } : null}
              onChange={(option: any) => {
                if (option) {
                  handleCompanySelect(option.value);
                } else {
                  handleCompanySelect("");
                }
              }}
              options={companyOptions}
              isDisabled={isLoadingCompanies}
              placeholder="Firma seçin"
              noOptionsMessage={() => "Firma bulunamadı"}
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingCompanies}
              isClearable
              onInputChange={handleCompanyInputChange}
              filterOption={() => true} // Disable built-in filtering
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
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  </div>
                )
              }}
            />
            {filteredCompanies.length > 100 && companyInputValue.length === 0 && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Search className="h-3 w-3 mr-1" />
                <span>Aramak için yazmaya başlayın (toplam {filteredCompanies.length} firma)</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>İletişim Kişisi</Label>
            <ReactSelect
              value={contactId ? { 
                value: contactId, 
                label: contacts.find(c => c.id === contactId)?.name || 
                       (() => {
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
              options={contactOptions}
              isDisabled={isLoadingContacts}
              placeholder="İletişim kişisi seçin"
              noOptionsMessage={() => "İletişim kişisi bulunamadı"}
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingContacts}
              isClearable
              onInputChange={handleContactInputChange}
              filterOption={() => true} // Disable built-in filtering
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
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  </div>
                )
              }}
            />
            {contacts.length > 100 && contactInputValue.length === 0 && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Search className="h-3 w-3 mr-1" />
                <span>Aramak için yazmaya başlayın (toplam {contacts.length} kişi)</span>
              </div>
            )}
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
