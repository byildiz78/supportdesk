"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { AlertCircle, Building2, ChevronDown, Info, KeyRound, Loader2, MessageSquare, Search } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useCompanies } from "@/providers/companies-provider"
import ReactSelect from "react-select"
import { debounce } from "lodash"
import { format } from "date-fns"

interface CompanyFormProps {
  parentCompanyId?: string
  companyId: string
  companyName: string
  onCompanyIdChange: (value: string) => void
  onCompanyNameChange: (value: string) => void
}

export default function CompanyForm({
  parentCompanyId = "",
  companyId,
  companyName,
  onCompanyIdChange,
  onCompanyNameChange
}: CompanyFormProps) {
  // Provider'lardan veri al
  const { companies, loading: isLoadingCompanies } = useCompanies();
  
  // Filtrelenmiş şirketler
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [companyInputValue, setCompanyInputValue] = useState("");
  
  // Arama için filtrelenmiş şirketler
  const [searchedCompanies, setSearchedCompanies] = useState<any[]>([]);

  // Şirket bilgileri için toggle state'leri
  const [isLicenseNotesOpen, setIsLicenseNotesOpen] = useState(false);
  const [isSupportNotesOpen, setIsSupportNotesOpen] = useState(false);
  const [isBANotesOpen, setIsBANotesOpen] = useState(false);
  
  // Seçilen şirket bilgisi
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<any>(null);
  
  // BA süresi kontrolü
  const isLicenseExpired = useMemo(() => {
    if (!selectedCompanyDetails?.flow_ba_end_date) return true;
    
    try {
      const endDate = new Date(selectedCompanyDetails.flow_ba_end_date);
      return endDate < new Date();
    } catch (e) {
      return true;
    }
  }, [selectedCompanyDetails]);

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
      setSelectedCompanyDetails(company);
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

  // Şirket input değeri değiştiğinde
  const handleCompanyInputChange = (inputValue: string) => {
    setCompanyInputValue(inputValue);
    searchCompanies(inputValue);
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
              Firma detayları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
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

          {selectedCompanyDetails && (
            <div>
              <Card className="overflow-hidden shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80">
                {/* License Information Card */}
                <div className={`h-0.5 w-full ${isLicenseExpired ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>

                <div className="p-3">
                  <div className={`font-medium mb-1.5 flex items-center ${isLicenseExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    <KeyRound className={`h-3.5 w-3.5 mr-1 ${isLicenseExpired ? 'text-red-500' : 'text-gray-500'}`} />
                    <span className="text-xs">
                      BA Bilgileri
                    </span>
                  </div>

                  {isLicenseExpired ? (
                    <div className="flex items-center py-1.5 px-2 bg-red-100 dark:bg-red-900/20 rounded-md text-xs shadow-sm">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        BA bulunmamaktadır
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="font-medium text-gray-500 dark:text-gray-400">Başlangıç:</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          {selectedCompanyDetails.flow_ba_starting_date ?
                            format(new Date(selectedCompanyDetails.flow_ba_starting_date), 'dd.MM.yyyy') :
                            'Belirtilmemiş'}
                        </div>

                        <div className="font-medium text-gray-500 dark:text-gray-400">Bitiş:</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          {selectedCompanyDetails.flow_ba_end_date ?
                            format(new Date(selectedCompanyDetails.flow_ba_end_date), 'dd.MM.yyyy') :
                            'Belirtilmemiş'}
                        </div>
                      </div>

                      {selectedCompanyDetails.flow_licence_notes && (
                        <div className="mt-1.5 border-t border-gray-200 dark:border-gray-700/50 pt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsLicenseNotesOpen(!isLicenseNotesOpen)}
                            className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors focus:outline-none"
                          >
                            <span className="flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              Lisans Notları
                            </span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isLicenseNotesOpen ? 'transform rotate-180' : ''}`} />
                          </button>
                          {isLicenseNotesOpen && (
                            <div className="whitespace-pre-line mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-md text-xs shadow-sm">
                              {selectedCompanyDetails.flow_licence_notes}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedCompanyDetails.flow_ba_notes && (
                        <div className="mt-1.5 border-t border-gray-200 dark:border-gray-700/50 pt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsBANotesOpen(!isBANotesOpen)}
                            className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors focus:outline-none"
                          >
                            <span className="flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              BA Notları
                            </span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isBANotesOpen ? 'transform rotate-180' : ''}`} />
                          </button>
                          {isBANotesOpen && (
                            <div className="whitespace-pre-line mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-md text-xs shadow-sm">
                              {selectedCompanyDetails.flow_ba_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Support Notes Card */}
              {selectedCompanyDetails.flow_support_notes && (
                <Card className="overflow-hidden shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 mt-3">
                  {/* Top Color Strip */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-blue-400 to-blue-500"></div>

                  <div className="p-3">
                    <div className="font-medium mb-1.5 flex items-center text-gray-700 dark:text-gray-300">
                      <MessageSquare className="h-3.5 w-3.5 mr-1 text-blue-500" />
                      <span className="text-xs">
                        Destek Notları
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setIsSupportNotesOpen(!isSupportNotesOpen)}
                        className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-400 text-xs font-medium py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors focus:outline-none"
                      >
                        <span className="flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          Detaylar
                        </span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${isSupportNotesOpen ? 'transform rotate-180' : ''}`} />
                      </button>
                      {isSupportNotesOpen && (
                        <div className="whitespace-pre-line mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-md text-xs shadow-sm">
                          {selectedCompanyDetails.flow_support_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
