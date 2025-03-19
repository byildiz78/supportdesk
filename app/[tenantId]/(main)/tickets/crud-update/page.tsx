"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save, Upload, X } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import axios from "@/lib/axios"
import { getUserId } from "@/utils/user-utils"
import { useTicketStore } from "@/stores/ticket-store"
import { useTabStore } from "@/stores/tab-store"
import { useCategories } from "@/providers/categories-provider"
import { useToast } from "@/components/ui/toast/use-toast"

// Import form components
import TicketInfoForm from "../components/TicketInfoForm"
import ParentCompanyForm from "../components/ParentCompanyForm"
import CompanyForm from "../components/CompanyForm"
import ContactForm from "../components/ContactForm"
import AssignmentForm from "../components/AssignmentForm"
import { toast } from "@/components/ui/toast/use-toast"

// Kategori, alt kategori ve grup için tip tanımlamaları
interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

// Props tipini tanımla
interface NewTicketPageProps {
  ticketId?: string;
}

export default function NewTicketPage({ ticketId }: NewTicketPageProps) {
  const router = useRouter()
  const params = useParams<{ tenantId: string }>()
  const tenantId = params?.tenantId || ""
  const { removeTab, setActiveTab } = useTabStore()
  const { addTicket, updateTicket } = useTicketStore()
  const { toast } = useToast()
  
  // CategoriesProvider'dan kategorileri al
  const { 
    categories, 
    loading: isLoadingCategories, 
    error: categoriesError,
    getSubcategoriesByCategoryId,
    getGroupsBySubcategoryId
  } = useCategories();

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Alt kategori ve grup için state'ler
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  const [ticketData, setTicketData] = useState({
    // Ticket info
    title: "",
    description: "",
    category: "",
    subcategory: "",
    group: "",
    priority: "medium",

    // Company info
    companyId: "",
    companyName: "",

    // Contact info
    contactId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",

    // Assignment info
    source: "web",
    assignedTo: "",
    dueDate: null as string | null,
    slaBreach: false,

    // Tags
    tags: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!ticketData.title.trim()) {
        throw new Error("Talep başlığı zorunludur")
      }

      const ticketPayload = {
        id: ticketId || undefined, // Eğer ticketId varsa, güncelleme işlemi yapılacak
        title: ticketData.title,
        description: ticketData.description,
        status: "open",
        priority: ticketData.priority,
        source: ticketData.source || "web", // Varsayılan değer ekledim
        // UUID alanları için null değer kullan eğer geçerli UUID değilse
        categoryId: isValidUUID(ticketData.category) ? ticketData.category : null,
        subcategoryId: isValidUUID(ticketData.subcategory) ? ticketData.subcategory : null,
        groupId: isValidUUID(ticketData.group) ? ticketData.group : null,
        assignedTo: isValidUUID(ticketData.assignedTo) ? ticketData.assignedTo : null,
        // Şirket ve kişi bilgileri veritabanı şemasına uygun olarak düzenlendi
        customer_name: ticketData.contactName || null,
        customer_email: ticketData.contactEmail || null,
        customer_phone: ticketData.contactPhone || null,
        company_name: ticketData.companyName || null,
        company_id: isValidUUID(ticketData.companyId) ? ticketData.companyId : null,
        contact_position: ticketData.contactPosition || null,
        parent_company_id: null, // UUID alanı, null kullan
        contact_id: isValidUUID(ticketData.contactId) ? ticketData.contactId : null,
        due_date: ticketData.dueDate || null,
        resolution_time: null, // Şimdilik boş, gerekirse daha sonra eklenebilir
        sla_breach: false, // Varsayılan değer
        tags: ticketData.tags || [],
        createdBy: getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9', // getUserId() fonksiyonu ile kullanıcı ID'sini alıyoruz
        tenantId: tenantId
      }

      try {
        const response = await axios.post('/api/main/tickets/createUpdateTicket', ticketPayload)
        if (response.data.success) {
          // Oluşturulan ticket ID'sini al
          const createdTicketId = response.data.id;

          // Yeni oluşturulan ticket'ı store'a ekle (sadece yeni oluşturma durumunda)
          if (!ticketId && createdTicketId) {
            // API'den tam ticket verisi dönmüyor, sadece ID dönüyor
            // Bu yüzden gönderdiğimiz verileri kullanarak bir ticket objesi oluşturalım
            const newTicket = {
              id: createdTicketId,
              ticketno: 0, // Backend otomatik atayacak, bu sadece geçici bir değer
              title: ticketPayload.title,
              description: ticketPayload.description,
              status: ticketPayload.status,
              priority: ticketPayload.priority,
              source: ticketPayload.source,

              // Veritabanı alanları
              category_id: ticketPayload.categoryId,
              category_name: null, // Şu an için bilinmiyor
              subcategory_id: ticketPayload.subcategoryId,
              group_id: ticketPayload.groupId,
              assigned_to: ticketPayload.assignedTo,
              assignedUserName: null, // Şu an için bilinmiyor
              customer_name: ticketPayload.customer_name,
              customer_email: ticketPayload.customer_email,
              customer_phone: ticketPayload.customer_phone,
              company_name: ticketPayload.company_name,
              company_id: ticketPayload.company_id,
              contact_id: ticketPayload.contact_id,
              contact_name: null,
              contact_first_name: null,
              contact_last_name: null,
              contact_email: null,
              contact_phone: null,
              contact_position: ticketPayload.contact_position,
              due_date: ticketPayload.due_date,
              resolution_time: null,
              parent_company_id: ticketPayload.parent_company_id,
              sla_breach: ticketPayload.sla_breach,

              // Ek alanlar
              tags: [],
              attachments: [],
              comments: [],
              created_at: new Date().toISOString(),
              created_by: getUserId() || null,
              updated_at: new Date().toISOString(),
              updated_by: getUserId() || null,
              is_deleted: false,

              // Frontend uyumluluğu için camelCase versiyonlar
              createdAt: new Date().toISOString(),
              createdBy: getUserId() || null,
              updatedAt: new Date().toISOString(),
              updatedBy: getUserId() || null
            };
            addTicket(newTicket, 'Tüm Talepler');
          }

          // If there are files, upload them as attachments
          if (files.length > 0) {
            try {
              if (!createdTicketId) {
                throw new Error('Ticket ID bulunamadı, dosya yüklenemedi');
              }

              const formData = new FormData();
              files.forEach(file => {
                formData.append('file', file);
              });

              formData.append('entityType', 'ticket');
              formData.append('entityId', createdTicketId);
              formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9');

              // Dosyaları yükle
              const uploadResponse = await axios.post('/api/main/files/uploadFile', formData);

              if (!uploadResponse.data.success) {
                throw new Error('Dosya yükleme başarısız');
              }

              toast({
                title: "Başarılı",
                description: `Talep ${ticketId ? 'güncellendi' : 'oluşturuldu'} ve ${files.length} dosya başarıyla yüklendi`,
              });
            } catch (error: any) {
              console.error('Dosya yükleme hatası:', error);
              toast({
                title: "Uyarı",
                description: `Talep ${ticketId ? 'güncellendi' : 'oluşturuldu'} ancak dosya yüklemede hata oluştu: ` + (error.message || "Bilinmeyen hata"),
                variant: "destructive",
              });
            }
          }
        } else {
          throw new Error(response.data.message || 'Talep oluşturulurken bir hata oluştu')
        }
        const tabId = ticketId ? `edit-ticket-${ticketId}` : 'new-ticket'
        removeTab(tabId)
        setActiveTab('Tüm Talepler')
      } catch (apiError: any) {
        throw new Error(apiError.response?.data?.message || apiError.message || 'API isteği başarısız oldu');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Kategori değiştiğinde alt kategorileri yükle
  useEffect(() => {
    if (!ticketData.category) {
      setSubcategories([]);
      setTicketData(prev => ({ ...prev, subcategory: '' }));
      return;
    }

    // Provider'dan alt kategorileri al
    setIsLoadingSubcategories(true);
    const subcats = getSubcategoriesByCategoryId(ticketData.category);
    setSubcategories(subcats);
    setIsLoadingSubcategories(false);
    
  }, [ticketData.category, getSubcategoriesByCategoryId]);

  // Alt kategori değiştiğinde grupları yükle
  useEffect(() => {
    if (!ticketData.subcategory) {
      setGroups([]);
      setTicketData(prev => ({ ...prev, group: '' }));
      return;
    }

    // Provider'dan grupları al
    setIsLoadingGroups(true);
    const groupsData = getGroupsBySubcategoryId(ticketData.subcategory);
    setGroups(groupsData);
    setIsLoadingGroups(false);
    
  }, [ticketData.subcategory, getGroupsBySubcategoryId]);

  // Eğer ticketId varsa, mevcut ticket verilerini yükle
  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketDetails = async () => {
      try {
        setIsSubmitting(true); // Yükleme durumunu göster
        const response = await axios.get(`/api/main/tickets/getTicketById`, { params: { ticketId: ticketId } });

        if (response.data.success) {
          const ticketData = response.data.data;
          console.log('Yüklenen ticket verileri:', ticketData);

          // Ticket verilerini forma doldur
          setTicketData({
            title: ticketData.title || "",
            description: ticketData.description || "",
            category: ticketData.category_id || "",
            subcategory: ticketData.subcategory_id || "",
            group: ticketData.group_id || "",
            priority: ticketData.priority || "medium",

            // Şirket bilgileri
            companyId: ticketData.company_id || "",
            companyName: ticketData.company_name || "",

            // İletişim bilgileri
            contactId: ticketData.contact_id || "",
            contactName: ticketData.customer_name || "",
            contactEmail: ticketData.customer_email || "",
            contactPhone: ticketData.customer_phone || "",
            contactPosition: ticketData.contact_position || "",

            // Atama bilgileri
            source: ticketData.source || "web",
            assignedTo: ticketData.assigned_to || "",
            dueDate: ticketData.due_date || null,
            slaBreach: ticketData.sla_breach || false,

            // Etiketler
            tags: ticketData.tags || []
          });

          // Eğer dosya ekleri varsa, onları da yükle
          if (ticketData.attachments && ticketData.attachments.length > 0) {
            // Burada dosya eklerini göstermek için bir işlem yapılabilir
            // Ancak dosyaları direkt olarak File nesnelerine dönüştüremeyiz
            // Bu nedenle sadece mevcut dosyaları göstermek için bir UI eklenmesi gerekebilir
          }
        } else {
          throw new Error(response.data.message || 'Ticket verileri yüklenemedi');
        }
      } catch (error: any) {
        console.error('Ticket verileri yüklenirken hata oluştu:', error);
        setError(error.message || 'Ticket verileri yüklenemedi');
      } finally {
        setIsSubmitting(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  // UUID formatını doğrulama fonksiyonu
  const isValidUUID = (uuid: string | undefined | null): boolean => {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-24">
            {/* Ticket Information Form */}
            <TicketInfoForm
              title={ticketData.title}
              description={ticketData.description}
              category={ticketData.category}
              subcategory={ticketData.subcategory}
              group={ticketData.group}
              priority={ticketData.priority}
              files={files}
              onTitleChange={(value) => setTicketData(prev => ({ ...prev, title: value }))}
              onDescriptionChange={(value) => setTicketData(prev => ({ ...prev, description: value }))}
              onCategoryChange={(value) => setTicketData(prev => ({ ...prev, category: value }))}
              onSubcategoryChange={(value) => setTicketData(prev => ({ ...prev, subcategory: value }))}
              onGroupChange={(value) => setTicketData(prev => ({ ...prev, group: value }))}
              onPriorityChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}
              onFileChange={handleFileChange}
              onFileRemove={handleRemoveFile}
              categories={categories}
              subcategories={subcategories}
              groups={groups}
              isLoadingCategories={isLoadingCategories}
              isLoadingSubcategories={isLoadingSubcategories}
              isLoadingGroups={isLoadingGroups}
            />

            {/* Company Form */}
            <CompanyForm
              companyId={ticketData.companyId}
              companyName={ticketData.companyName}
              contactId={ticketData.contactId}
              contactName={ticketData.contactName}
              contactEmail={ticketData.contactEmail}
              contactPhone={ticketData.contactPhone}
              contactPosition={ticketData.contactPosition}
              onCompanyIdChange={(value) => setTicketData(prev => ({
                ...prev,
                companyId: value,
                // Reset contact when company changes
                contactId: "",
                contactName: "",
                contactEmail: "",
                contactPhone: "",
                contactPosition: ""
              }))}
              onCompanyNameChange={(value) => setTicketData(prev => ({ ...prev, companyName: value }))}
              onContactIdChange={(value) => setTicketData(prev => ({ ...prev, contactId: value }))}
              onContactNameChange={(value) => setTicketData(prev => ({ ...prev, contactName: value }))}
              onContactEmailChange={(value) => setTicketData(prev => ({ ...prev, contactEmail: value }))}
              onContactPhoneChange={(value) => setTicketData(prev => ({ ...prev, contactPhone: value }))}
              onContactPositionChange={(value) => setTicketData(prev => ({ ...prev, contactPosition: value }))}
            />

            {/* Contact Form */}
            <ContactForm
              companyId={ticketData.companyId}
              contactId={ticketData.contactId}
              contactName={ticketData.contactName}
              contactEmail={ticketData.contactEmail}
              contactPhone={ticketData.contactPhone}
              contactPosition={ticketData.contactPosition}
              onContactIdChange={(value) => setTicketData(prev => ({ ...prev, contactId: value }))}
              onContactNameChange={(value) => setTicketData(prev => ({ ...prev, contactName: value }))}
              onContactEmailChange={(value) => setTicketData(prev => ({ ...prev, contactEmail: value }))}
              onContactPhoneChange={(value) => setTicketData(prev => ({ ...prev, contactPhone: value }))}
              onContactPositionChange={(value) => setTicketData(prev => ({ ...prev, contactPosition: value }))}
            />

            {/* Assignment Form */}
            <AssignmentForm
              assignedTo={ticketData.assignedTo}
              source={ticketData.source}
              dueDate={ticketData.dueDate}
              slaBreach={ticketData.slaBreach}
              onAssignedToChange={(value) => setTicketData(prev => ({ ...prev, assignedTo: value }))}
              onSourceChange={(value) => setTicketData(prev => ({ ...prev, source: value }))}
              onDueDateChange={(value) => setTicketData(prev => ({ ...prev, dueDate: value }))}
              onSlaBreachChange={(value) => setTicketData(prev => ({ ...prev, slaBreach: value }))}
            />

            {/* File Upload Form */}
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold">Dosya Ekle</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya Seç
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </div>

                {files.length > 0 && (
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500 mb-2">Seçilen Dosyalar ({files.length})</p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <span className="text-sm font-medium truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 p-4 bg-background border-t flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !ticketData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  )
}