"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Loader2, Search, User, RefreshCw } from "lucide-react"
import { useState, useMemo } from "react"
import { useContacts } from "@/providers/contacts-provider"
import ReactSelect from "react-select"
import { debounce } from "lodash"
import { Button } from "@/components/ui/button"

interface ContactFormProps {
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
  const { contacts, loading: isLoadingContacts, refreshContacts } = useContacts();
  
  // Arama için state
  const [contactInputValue, setContactInputValue] = useState("");
  const [searchedContacts, setSearchedContacts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
          const email = contact.email || '';
          const phone = contact.phone || contact.mobile || '';
          
          return contactName.toLowerCase().includes(searchTerm) || 
                 companyName.toLowerCase().includes(searchTerm) ||
                 email.toLowerCase().includes(searchTerm) ||
                 phone.includes(searchTerm);
        })
        .slice(0, 100); // Sadece ilk 100 sonucu göster
      
      setSearchedContacts(results);
    }, 300),
  [contacts]);

  // Kişileri yenile
  const handleRefreshContacts = async () => {
    setIsRefreshing(true);
    await refreshContacts();
    setIsRefreshing(false);
  };

  // Kişi input değeri değiştiğinde
  const handleContactInputChange = (inputValue: string) => {
    setContactInputValue(inputValue);
    searchContacts(inputValue);
  };

  const handleContactSelect = (id: string) => {
    if (!id) {
      // Eğer seçim temizlendiyse, tüm alanları temizle
      onContactIdChange("");
      onContactNameChange("");
      onContactEmailChange("");
      onContactPhoneChange("");
      onContactPositionChange("");
      return;
    }
    
    onContactIdChange(id);
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      // İsim için hem yeni hem eski alan adlarını kontrol et
      const firstName = contact.firstName || contact.first_name || '';
      const lastName = contact.lastName || contact.last_name || '';
      const fullName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
      
      onContactNameChange(fullName);
      onContactEmailChange(contact.email || "");
      onContactPhoneChange(contact.phone || contact.mobile || "");
      onContactPositionChange(contact.position || "");
    }
  };

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
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <User className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400">
              İletişim Bilgileri
            </h3>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
              İletişim kurulacak kişi bilgileri
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshContacts}
            disabled={isRefreshing}
            className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/50"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Yenile</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>İletişim Kişisi Seçin (Opsiyonel)</Label>
            <ReactSelect
              value={contactId ? { 
                value: contactId, 
                label: (() => {
                  const contact = contacts.find(c => c.id === contactId);
                  if (contact) {
                    const firstName = contact.firstName || contact.first_name || '';
                    const lastName = contact.lastName || contact.last_name || '';
                    const contactName = contact.name || `${firstName} ${lastName}`.trim() || "İsimsiz Kişi";
                    const companyName = contact.companyName || '';
                    return `${contactName} ${companyName ? `(${companyName})` : ''}`;
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
              placeholder="İletişim kişisi seçin veya aşağıdaki alanları doldurun"
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
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
            <div className="text-xs text-muted-foreground mt-2">
              Listeden kişi seçebilir veya aşağıdaki alanları manuel olarak doldurabilirsiniz.
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>İsim Soyisim</Label>
            <Input
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              placeholder="İsim Soyisim"
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
            <div className="relative">
              <div className="flex">
                <div className="flex items-center justify-center bg-muted px-3 border border-r-0 border-input rounded-l-md">
                  +90
                </div>
                <Input
                  value={(contactPhone || "").replace(/^\+90/, "")}
                  onChange={(e) => {
                    // Sadece sayıları kabul et ve +90 ön ekini ekle
                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                    onContactPhoneChange(`+90${onlyNumbers}`);
                  }}
                  placeholder="5XX XXX XX XX"
                  className="rounded-l-none"
                />
              </div>
            </div>
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
