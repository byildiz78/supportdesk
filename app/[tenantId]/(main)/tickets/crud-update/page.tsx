"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save, Upload, X } from "lucide-react"
import { FileAttachment, Ticket } from "@/types/tickets"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import axios from "@/lib/axios"
import { getUserId } from "@/utils/user-utils"
import { useCategories } from "@/providers/categories-provider"
import { useTicketStore } from "@/stores/ticket-store"
import { useTabStore } from "@/stores/tab-store"
import { useUsers } from "@/providers/users-provider"
import TicketInfoForm from "../components/TicketInfoForm"
import CompanyForm from "../components/CompanyForm"
import ContactForm from "../components/ContactForm"
import AssignmentForm from "../components/AssignmentForm"
import { toast } from "@/components/ui/toast/use-toast"

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

interface NewTicketPageProps {
  ticketId?: string;
}

export default function NewTicketPage({ ticketId }: NewTicketPageProps) {
  const router = useRouter()
  const params = useParams<{ tenantId: string }>()
  const tenantId = params?.tenantId || ""
  
  
  // CategoriesProvider'dan kategorileri al
  const { 
    categories, 
    loading: isLoadingCategories, 
    error: categoriesError,
    getSubcategoriesByCategoryId,
    getGroupsBySubcategoryId
  } = useCategories();

  const { users } = useUsers() // Kullanıcı listesini al
  const { addTicket, updateTicket } = useTicketStore()
  const { setActiveTab, removeTab } = useTabStore()

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // EKLENEN SATIR: Veri yükleme durumu için flag
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(false)
  
  // Dosya işleme fonksiyonları
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

  // Kategori, alt kategori ve grup adlarını saklamak için state'ler
  const [categoryName, setCategoryName] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");

  const [ticketData, setTicketData] = useState({
    // Ticket info
    title: "",
    description: "",
    category: "",
    subcategory: "",
    group: "",
    group_name: "", // API'den gelen grup adı
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
      // Validate required fields
      if (!ticketData.title.trim()) {
        throw new Error("Talep başlığı zorunludur")
      }

      // Prepare ticket data for API - veritabanı şemasına uygun olarak düzenlendi
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
          // If there are files, upload them as attachments
          if (files.length > 0) {
            try {
              // Ticket ID'yi API yanıtından al
              const ticketId = response.data.id;
              
              // FormData oluştur
              const formData = new FormData();
              
              // Dosyaları FormData'ya ekle
              files.forEach(file => {
                formData.append('file', file);
              });
              
              // Metadata ekle
              formData.append('entityType', 'ticket');
              formData.append('entityId', ticketId);
              formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9'); // getUserId() fonksiyonu ile kullanıcı ID'sini alıyoruz
              
              // Dosyaları yükle
              const uploadResponse = await axios.post('/api/main/files/uploadFile', formData);
              
              if (uploadResponse.data.success) {
                toast({
                    title: "Dosya Yüklendi",
                    description: `Dosya başarıyla yüklendi: ${files[0].name}`,
                    variant: "default",
                    className: "bg-green-100 border-green-500 text-green-800",
                });
              } else {
                console.error('Dosya yükleme başarısız:', uploadResponse.data);
                throw new Error(uploadResponse.data.message || 'Dosya yükleme başarısız');
              }
            } catch (error: any) {
              console.error('Dosya yükleme hatası:', error);
              
              // Hata detaylarını logla
              if (error.response) {
                console.error('Hata yanıtı:', error.response.data);
                console.error('Hata durumu:', error.response.status);
              } else if (error.request) {
                console.error('Yanıt alınamadı, istek:', error.request);
              }
              
              toast({
                title: "Uyarı",
                description: `Talep ${ticketId ? 'güncellendi' : 'oluşturuldu'} ancak dosya yüklemede hata oluştu: ` + (error.message || "Bilinmeyen hata"),
                variant: "destructive",
              });
            }
          }

          const tabId = ticketId ? `edit-ticket-${ticketId}` : "new-ticket";
          removeTab(tabId)
          const newTicket: Ticket = {
            id: ticketId || response.data.id, // Ensure ID is set when updating
            ticketno: response.data.ticketno, // Veritabanından gelen ticket numarasını kullan
            title: ticketData.title,
            description: ticketData.description,
            status: "open",
            priority: ticketData.priority,
            source: ticketData.source || null,
            
            // Hem snake_case hem de camelCase versiyonlarını ekleyelim
            category_id: ticketData.category || null,
            categoryId: ticketData.category || null,
            category_name: categoryName,
            subcategory_id: ticketData.subcategory || null,
            subcategoryId: ticketData.subcategory || null,
            subcategory_name: subcategoryName,
            group_id: ticketData.group || null,
            groupId: ticketData.group || null,
            group_name: groupName,
            assigned_to: ticketData.assignedTo || null,
            assignedTo: ticketData.assignedTo || null,
            customer_name: ticketData.contactName || null,
            customerName: ticketData.contactName || null,
            customer_email: ticketData.contactEmail || null,
            customerEmail: ticketData.contactEmail || null,
            customer_phone: ticketData.contactPhone || null,
            customerPhone: ticketData.contactPhone || null,
            company_name: ticketData.companyName || null,
            companyName: ticketData.companyName || null,
            company_id: ticketData.companyId || null,
            companyId: ticketData.companyId || null,
            contact_id: ticketData.contactId || null,
            contactId: ticketData.contactId || null,
            contact_name: ticketData.contactName || null,
            contactName: ticketData.contactName || null,
            contact_first_name: null,
            contact_last_name: null,
            contact_email: ticketData.contactEmail || null,
            contact_phone: ticketData.contactPhone || null,
            contact_position: ticketData.contactPosition || null,
            contactPosition: ticketData.contactPosition || null,
            due_date: ticketData.dueDate || null,
            dueDate: ticketData.dueDate || null,
            resolution_time: null,
            resolutionTime: null,
            parent_company_id: null,
            parentCompanyId: null,
            sla_breach: false,
            slaBreach: false,
            
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            created_by: null,
            createdBy: null,
            updated_at: null,
            updatedAt: null,
            updated_by: null,
            updatedBy: null,
            is_deleted: false
          };
          if (ticketData.assignedTo) {
            const assignedUser = users.find(user => user.id === ticketData.assignedTo);
            if (assignedUser) {
              newTicket.assignedUserName = assignedUser.name;
            }
          }
          
          // Eğer ticketId varsa güncelleme, yoksa yeni ekleme yap
          if (ticketId) {
            // Mevcut talebi güncelle
            updateTicket(newTicket);
            setActiveTab('Tüm Talepler');
            
            // Başarı bildirimi göster
            toast({
              title: "Başarılı",
              description: "Talep başarıyla güncellendi.",
              variant: "default",
            });
          } else {
            // Yeni talep ekle
            const ticketAdded = addTicket(newTicket, 'Tüm Talepler');
            
            if (ticketAdded) {
              setActiveTab('Tüm Talepler');
              
              // Başarı bildirimi göster
              toast({
                title: "Başarılı",
                description: "Talep başarıyla oluşturuldu.",
                variant: "default",
              });
            } else {
              // Mükerrer talep hatası göster
              toast({
                title: "Hata",
                description: "Bu başlık ve şirket için zaten bir talep bulunmaktadır.",
                variant: "destructive",
              });
            }
          }
        } else {
          throw new Error(response.data.message || 'Talep oluşturulurken bir hata oluştu')
        }
      } catch (apiError: any) {
        throw new Error(apiError.response?.data?.message || apiError.message || 'API isteği başarısız oldu');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // DÜZENLENEN: Kategori değiştiğinde alt kategorileri yükle
  useEffect(() => {
    if (!ticketData.category) {
      // Sadece başlangıç yüklemesi sırasında değilse, alt kategoriyi sıfırla
      if (!isInitialDataLoading) {
        setSubcategories([]);
        setTicketData(prev => ({ ...prev, subcategory: '' }));
        setSubcategoryName('');
      }
      return;
    }

    // Provider'dan alt kategorileri al
    setIsLoadingSubcategories(true);
    const subcats = getSubcategoriesByCategoryId(ticketData.category);
    setSubcategories(subcats);
    
    // Eğer düzenleme modunda ve alt kategori ID'si varsa, adını güncelle
    if (isInitialDataLoading && ticketData.subcategory) {
      const subcatName = subcats.find(sc => sc.id === ticketData.subcategory)?.name;
      if (subcatName) {
        setSubcategoryName(subcatName);
      }
    }
    
    setIsLoadingSubcategories(false);
    
  }, [ticketData.category, getSubcategoriesByCategoryId, isInitialDataLoading, ticketData.subcategory]);

  // DÜZENLENEN: Alt kategori değiştiğinde grupları yükle
  useEffect(() => {
    if (!ticketData.subcategory) {
      // Sadece başlangıç yüklemesi sırasında değilse, grup bilgisini sıfırla
      if (!isInitialDataLoading) {
        setGroups([]);
        setTicketData(prev => ({ ...prev, group: '' }));
        setGroupName('');
      }
      return;
    }

    // Provider'dan grupları al
    setIsLoadingGroups(true);
    const groupsData = getGroupsBySubcategoryId(ticketData.subcategory);
    setGroups(groupsData);
    
    // Eğer düzenleme modunda ve grup ID'si varsa, adını güncelle
    if (isInitialDataLoading && ticketData.group) {
      const groupName = groupsData.find(g => g.id === ticketData.group)?.name;
      if (groupName) {
        setGroupName(groupName);
        setTicketData(prev => ({ ...prev, group_name: groupName }));
      }
    }
    
    setIsLoadingGroups(false);
    
  }, [ticketData.subcategory, getGroupsBySubcategoryId, isInitialDataLoading, ticketData.group]);

  // DÜZENLENEN: Eğer ticketId varsa, mevcut ticket verilerini yükle
  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketDetails = async () => {
      try {
        setIsSubmitting(true); // Yükleme durumunu göster
        setIsInitialDataLoading(true); // Başlangıç veri yüklemesi aktif

        const response = await axios.get(`/api/main/tickets/getTicketById`, { params: { ticketId: ticketId } });
        
        if (response.data.success) {
          const ticketData = response.data.data;
          
          // Önce kategori, alt kategori ve grup verilerini hazırla
          const categoryId = ticketData.category_id || "";
          const subcategoryId = ticketData.subcategory_id || "";
          const groupId = ticketData.group_id || "";
          
          // Kategori, alt kategori ve grup adlarını sakla
          const catName = ticketData.category_name || "";
          const subcatName = ticketData.subcategory_name || "";
          const grpName = ticketData.group_name || "";
          
          setCategoryName(catName);
          setSubcategoryName(subcatName);
          setGroupName(grpName);
          
          // Kategori varsa, alt kategorileri yükle
          if (categoryId) {
            setIsLoadingSubcategories(true);
            const subcats = getSubcategoriesByCategoryId(categoryId);
            setSubcategories(subcats);
            setIsLoadingSubcategories(false);
            
            // Alt kategori varsa, grupları yükle
            if (subcategoryId) {
              setIsLoadingGroups(true);
              const groupsData = getGroupsBySubcategoryId(subcategoryId);
              setGroups(groupsData);
              setIsLoadingGroups(false);
            }
          }
          
          // Veri yükleme tamamlandıktan sonra ticket verilerini state'e yükle
          setTicketData({
            title: ticketData.title || "",
            description: ticketData.description || "",
            category: categoryId,
            subcategory: subcategoryId,
            group: groupId,
            group_name: grpName, // API'den gelen grup adı
            priority: ticketData.priority || "medium",
            
            // Şirket bilgileri
            companyId: ticketData.company_id || "",
            companyName: ticketData.company_name || "",
            
            // İletişim bilgileri - Burada customer_* alanlarını kullanıyoruz
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
        } else {
          throw new Error(response.data.message || 'Ticket verileri yüklenemedi');
        }
      } catch (error: any) {
        console.error('Ticket verileri yüklenirken hata oluştu:', error);
        setError(error.message || 'Ticket verileri yüklenemedi');
      } finally {
        setIsSubmitting(false);
        // Tüm state güncellemeleri işlendikten sonra loading flag'i kaldır
        setTimeout(() => {
          setIsInitialDataLoading(false);
        }, 100);
      }
    };

    fetchTicketDetails();
  }, [ticketId, getSubcategoriesByCategoryId, getGroupsBySubcategoryId]);

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
              onCategoryChange={(value) => {
                // Kategori değiştiğinde, kategori adını da güncelle
                const selectedCategory = categories.find(cat => cat.id === value);
                setCategoryName(selectedCategory?.name || "");
                
                if (isInitialDataLoading) {
                  // Başlangıç yüklemesi sırasında sadece kategori değerini güncelle
                  // alt kategori ve grup değerlerini koruyarak
                  setTicketData(prev => ({ 
                    ...prev, 
                    category: value
                  }));
                } else {
                  // Normal kullanımda kategori değiştiğinde alt kategori ve grup bilgilerini sıfırla
                  setTicketData(prev => ({ 
                    ...prev, 
                    category: value,
                    subcategory: "",
                    group: ""
                  }));
                  
                  // Alt kategori ve grup adlarını da sıfırla
                  setSubcategoryName("");
                  setGroupName("");
                }
              }}
              onSubcategoryChange={(value) => {
                // Alt kategori değiştiğinde, alt kategori adını da güncelle
                const selectedSubcategory = subcategories.find(subcat => subcat.id === value);
                setSubcategoryName(selectedSubcategory?.name || "");
                
                if (isInitialDataLoading) {
                  // Başlangıç yüklemesi sırasında sadece alt kategori değerini güncelle
                  // grup değerini koruyarak
                  setTicketData(prev => ({ 
                    ...prev, 
                    subcategory: value
                  }));
                } else {
                  // Normal kullanımda alt kategori değiştiğinde grup bilgisini sıfırla
                  setTicketData(prev => ({ 
                    ...prev, 
                    subcategory: value,
                    group: ""
                  }));
                  
                  // Grup adını da sıfırla
                  setGroupName("");
                }
              }}
              onGroupChange={(value) => {
                // Grup değiştiğinde, grup adını da güncelle
                const selectedGroup = groups.find(grp => grp.id === value);
                setGroupName(selectedGroup?.name || "");
                
                // Grup değişikliğini state'e yansıt
                setTicketData(prev => ({ 
                  ...prev, 
                  group: value,
                  group_name: selectedGroup?.name || ""
                }));
              }}
              onPriorityChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}
              onFileChange={handleFileChange}
              onFileRemove={handleRemoveFile}
              categories={categories}
              subcategories={subcategories}
              groups={groups}
              isLoadingCategories={isLoadingCategories}
              isLoadingSubcategories={isLoadingSubcategories}
              isLoadingGroups={isLoadingGroups}
              categoryName={categoryName}
              subcategoryName={subcategoryName}
              groupName={groupName}
              group_name={ticketData.group_name}
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