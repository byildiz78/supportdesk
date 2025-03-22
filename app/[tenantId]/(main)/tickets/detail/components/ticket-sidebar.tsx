"use client"

import { Card } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Check,
    Clock,
    Folder,
    Loader2,
    Save,
    Tag,
    User,
    Building,
    Phone,
    Flag,
    Mail,
    Building as Building2,
    Tag as TagIcon,
    CheckCircle,
    Plus,
    X,
    KeyRound,
    Search,
    ChevronDown,
    Edit
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TicketService } from "../services/ticket-service"
import { useCompanies } from "@/providers/companies-provider"
import { useUsers } from "@/providers/users-provider"
import { useContacts } from "@/providers/contacts-provider"
import { Group, useCategories } from "@/providers/categories-provider"
import { toast } from "@/components/ui/toast/use-toast"
import { useTabStore } from "@/stores/tab-store"
import { useTicketStore } from "@/stores/ticket-store"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import CategoryForm from "../../components/CategoryForm"
import ReactSelect from "react-select"
import axios from "@/lib/axios"

interface TicketSidebarProps {
    ticket: any;
    onTicketUpdate: (updatedTicket: any) => void;
}

export function TicketSidebar({ ticket, onTicketUpdate }: TicketSidebarProps) {
    const { companies, loading: loadingCompanies } = useCompanies()
    const { users, isLoading: loadingUsers } = useUsers()
    const { contacts, loading: loadingContacts } = useContacts()
    const { categories, loading: loadingCategories, groups } = useCategories()
    const { removeResolvedClosedTickets } = useTicketStore();
    const [updatedTicket, setUpdatedTicket] = useState<any>(ticket || {})
    const [isSaving, setIsSaving] = useState(false)
    const { removeTab, setActiveTab } = useTabStore();
    const [tags, setTags] = useState<any[]>([])
    const [loadingTags, setLoadingTags] = useState(false)
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
    const [resolutionDetails, setResolutionDetails] = useState("")
    const [isResolvingTicket, setIsResolvingTicket] = useState(false)
    const [newTag, setNewTag] = useState("")
    const [resolutionTags, setResolutionTags] = useState<any[]>([])
    const [validationError, setValidationError] = useState<string | null>(null)
    const [companySearch, setCompanySearch] = useState("")
    const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
    const menuPortalTarget = typeof document !== 'undefined' ? document.body : null

    // İletişim bilgileri için state'ler
    const [contactInfo, setContactInfo] = useState({
        name: "",
        position: "",
        email: "",
        phone: ""
    })
    const [isEditingContact, setIsEditingContact] = useState(false)
    const [loadingContactInfo, setLoadingContactInfo] = useState(false)

    // Tüm ReactSelect bileşenleri için ortak stiller
    const selectClassNames = {
        control: (state: any) =>
            `border rounded-md p-0.5 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
        placeholder: () => "text-muted-foreground text-sm",
        input: () => "text-foreground text-sm",
        option: (state: any) =>
            `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''} text-sm py-1`,
        menu: () => "bg-background border rounded-md shadow-md mt-1 z-[1000]",
    }

    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any) => ({
            ...base,
            minHeight: '32px',
            height: '32px'
        }),
        valueContainer: (base: any) => ({
            ...base,
            height: '32px',
            padding: '0 6px',
            display: 'flex',
            justifyContent: 'left'
        }),
        indicatorsContainer: (base: any) => ({
            ...base,
            height: '32px'
        }),
        singleValue: (base: any) => ({
            ...base,
            textAlign: 'left',
            margin: 0,
            position: 'static',
            transform: 'none',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }),
        placeholder: (base: any) => ({
            ...base,
            textAlign: 'left',
            margin: 0,
            position: 'static',
            transform: 'none'
        }),
        input: (base: any) => ({
            ...base,
            margin: 0,
            padding: 0
        })
    }

    // Bilet değiştiğinde updatedTicket'ı güncelle
    useEffect(() => {
        if (ticket) {
            setUpdatedTicket(ticket)
            if (ticket.id) {
                fetchTags(ticket.id)
            }

            // Ticket'ta telefon numarası veya email varsa kişi bilgilerini getir
            if (ticket.customer_phone || ticket.customer_email) {
                fetchContactInfo(ticket.customer_phone, ticket.customer_email)
            } else {
                // Kişi bilgisi yoksa contact info'yu temizle
                setContactInfo({
                    name: ticket.customer_name || "",
                    position: ticket.contact_position || "",
                    email: ticket.customer_email || "",
                    phone: ticket.customer_phone || ""
                })
            }
        }
    }, [ticket])

    // Telefon numarası veya email'e göre kişi bilgilerini getir
    const fetchContactInfo = async (phoneNumber?: string, email?: string) => {
        if (!phoneNumber && !email) return

        setLoadingContactInfo(true)
        try {
            let queryParams = '';
            if (phoneNumber) {
                queryParams += `phoneNumber=${encodeURIComponent(phoneNumber)}`;
            }
            if (email) {
                if (queryParams) queryParams += '&';
                queryParams += `email=${encodeURIComponent(email)}`;
            }

            const response = await axios.get(`/api/main/contacts/getContactPhoneNumber?${queryParams}`)

            if (response.data.success && response.data.data) {
                const contactData = response.data.data
                setContactInfo({
                    name: contactData.name || "",
                    position: contactData.position || "",
                    email: contactData.email || "",
                    phone: contactData.phone || phoneNumber || ""
                })

                // Ticket'ı da güncelle
                setUpdatedTicket((prev: any) => ({
                    ...prev,
                    customer_name: contactData.name || prev.customer_name,
                    customer_email: contactData.email || prev.customer_email,
                    contact_position: contactData.position || prev.contact_position
                }))
            } else {
                // Kişi bulunamadıysa sadece telefon numarasını veya email'i ayarla
                setContactInfo({
                    name: updatedTicket.customer_name || "",
                    position: updatedTicket.contact_position || "",
                    email: updatedTicket.customer_email || email || "",
                    phone: phoneNumber || ""
                })
            }
        } catch (error) {
            console.error("Kişi bilgileri alınırken hata oluştu:", error)
            // Hata durumunda mevcut bilgileri kullan
            setContactInfo({
                name: updatedTicket.customer_name || "",
                position: updatedTicket.contact_position || "",
                email: updatedTicket.customer_email || "",
                phone: phoneNumber || ""
            })
        } finally {
            setLoadingContactInfo(false)
        }
    }

    // İletişim bilgilerini güncelle
    const handleContactInfoChange = (field: string, value: string) => {
        setContactInfo(prev => ({
            ...prev,
            [field]: value
        }))

        // Ticket'ı da güncelle
        if (field === 'name') {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                customer_name: value
            }))
        } else if (field === 'email') {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                customer_email: value
            }))
        } else if (field === 'phone') {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                customer_phone: value
            }))
        } else if (field === 'position') {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                contact_position: value
            }))
        }
    }

    // Etiketleri getir
    const fetchTags = async (ticketId: string) => {
        setLoadingTags(true)
        try {
            const fetchedTags = await TicketService.getTicketTags(ticketId)
            setTags(fetchedTags)
            setResolutionTags([...fetchedTags]) // Çözüm modalı için etiketleri kopyala
        } catch (error) {
            console.error("Etiketler alınırken hata oluştu:", error)
        } finally {
            setLoadingTags(false)
        }
    }

    // Etiket için rastgele renk oluştur (tutarlı olması için tag id'sini kullanıyoruz)
    const getTagColor = (tagId: string) => {
        // Renk paleti
        const colors = [
            "bg-blue-100 text-blue-800 border-blue-300",
            "bg-green-100 text-green-800 border-green-300",
            "bg-yellow-100 text-yellow-800 border-yellow-300",
            "bg-red-100 text-red-800 border-red-300",
            "bg-purple-100 text-purple-800 border-purple-300",
            "bg-pink-100 text-pink-800 border-pink-300",
            "bg-indigo-100 text-indigo-800 border-indigo-300",
            "bg-gray-100 text-gray-800 border-gray-300",
        ]

        // Tag ID'sinden sayısal bir değer oluştur
        let hash = 0
        for (let i = 0; i < tagId.length; i++) {
            hash = tagId.charCodeAt(i) + ((hash << 5) - hash)
        }

        // Renk paletinden bir renk seç
        const index = Math.abs(hash) % colors.length
        return colors[index]
    }

    // SLA bitiş tarihini hesaplama fonksiyonu
    const calculateDueDate = (createdAt: string, groupId: string) => {
        if (!createdAt || !groupId) return null;

        // Ticket oluşturulma zamanını al
        const createdDate = new Date(createdAt);

        // Seçilen grubun SLA bilgilerini al
        const selectedSubcategoryId = updatedTicket?.subcategory_id;
        if (!selectedSubcategoryId) return null;

        // categories-provider'dan groups bilgisini al
        const groupsInSubcategory = groups[selectedSubcategoryId] || [];
        const selectedGroup = groupsInSubcategory.find((g: Group) => g.id === groupId);

        if (!selectedGroup) return null;

        // SLA değerini belirle (dakika cinsinden)
        let slaMinutes = 0;

        const createdHour = createdDate.getHours();
        const isWeekend = createdDate.getDay() === 0 || createdDate.getDay() === 6; // 0: Pazar, 6: Cumartesi
        const isWorkingHours = createdHour >= 9 && createdHour < 18; // 09:00 - 18:00 arası mesai saatleri

        if (isWeekend) {
            if (isWorkingHours) {
                slaMinutes = selectedGroup.haftaSonuMesaiSla || 180; // Hafta sonu mesai saatleri içinde
            } else {
                slaMinutes = selectedGroup.haftaSonuMesaiDisiSla || 240; // Hafta sonu mesai saatleri dışında
            }
        } else {
            if (isWorkingHours) {
                slaMinutes = selectedGroup.mesaiSaatleriSla || 60; // Hafta içi mesai saatleri içinde
            } else {
                slaMinutes = selectedGroup.mesaiDisiSla || 120; // Hafta içi mesai saatleri dışında
            }
        }

        const dueDate = new Date(createdDate);

        // Yeni eklenen ayar - SLA sonraki gün başlar
        const slaNextDayStart = selectedGroup.slaNextDayStart || false;

        if (slaNextDayStart && !isWorkingHours) {
            // SLA sonraki günün mesai başlangıcından itibaren hesaplanacak
            // SADECE mesai saatleri DIŞINDAYSA bir sonraki iş gününe geç
            dueDate.setDate(dueDate.getDate() + 1);
            dueDate.setHours(9, 0, 0, 0);

            // Eğer sonraki gün hafta sonuysa, Pazartesiye taşı
            const nextDay = dueDate.getDay();
            if (nextDay === 0) { // Pazar
                dueDate.setDate(dueDate.getDate() + 1);
            } else if (nextDay === 6) { // Cumartesi
                dueDate.setDate(dueDate.getDate() + 2);
            }

            // Sonraki iş gününün başlangıcından itibaren SLA süresini ekle
            dueDate.setMinutes(dueDate.getMinutes() + slaMinutes);
        } else {
            // Normal SLA hesaplama mantığı - doğrudan şu anki zamana SLA süresini ekle
            dueDate.setMinutes(dueDate.getMinutes() + slaMinutes);
        }

        return dueDate;
    };

    // Durum değiştiğinde
    const handleStatusChange = (value: string) => {
        setUpdatedTicket((prev: any) => {
            const updated = {
                ...prev,
                status: value
            }
            return updated
        })

        // Eğer durum "resolved" veya "closed" ise, zorunlu alanları kontrol et
        if (value === "resolved" || value === "closed") {
            if (!updatedTicket.category_id || !updatedTicket.subcategory_id || !updatedTicket.company_id) {
                setValidationError("Bilet çözümlenebilmesi için Kategori, Alt Kategori ve Firma seçimlerini yapmanız gerekmektedir.")

                // Kullanıcıya uyarı göster
                toast({
                    title: "Uyarı",
                    description: "Bilet çözümlenebilmesi için Kategori, Alt Kategori ve Firma seçimlerini yapmanız gerekmektedir.",
                    variant: "destructive",
                })
                return
            }

            // Validasyon geçildi, kullanıcıya bilgi mesajı göster
            setValidationError(null)
            toast({
                title: "Bilgi",
                description: `Bilet ${value === "resolved" ? "çözümlendi" : "kapalı"} olarak işaretlenecek. Değişiklikleri kaydetmek için 'Kaydet' butonuna tıklayın.`,
                variant: "default",
            })
        } else {
            // Başka bir durum seçildiğinde validasyon hatasını temizle
            setValidationError(null)
        }
    }

    // Öncelik değiştiğinde
    const handlePriorityChange = (value: string) => {
        setUpdatedTicket((prev: any) => {
            const updated = {
                ...prev,
                priority: value
            }
            return updated
        })
    }

    // Atanan kişi değiştiğinde
    const handleAssignedToChange = (value: string) => {
        setUpdatedTicket((prev: any) => ({
            ...prev,
            assigned_to: value,
            assignedTo: value
        }))
    }

    // Firma değiştiğinde
    const handleCompanyChange = (value: string) => {

        if (!value) {
            const updated = {
                ...updatedTicket,
                company_id: null,
                company_name: null
            };
            setUpdatedTicket(updated);
            return;
        }

        const selectedCompany = companies.find(company => company.id === value)
        if (selectedCompany) {
            const updated = {
                ...updatedTicket,
                company_id: value,
                company_name: selectedCompany.name || "İsimsiz Firma"
            };
            setUpdatedTicket(updated);
        }
    }

    // Kişi değiştiğinde
    const handleContactChange = (value: string) => {
        if (!value) {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                contact_id: null,
                customer_name: null,
                customer_email: null,
                customer_phone: null,
                contact_position: null
            }))
            return
        }

        const selectedContact = contacts.find(contact => contact.id === value)
        if (selectedContact) {
            // Contact nesnesinde name özelliği olmayabilir, bu durumda firstName ve lastName kullan
            const firstName = selectedContact.firstName || selectedContact.first_name || '';
            const lastName = selectedContact.lastName || selectedContact.last_name || '';
            const contactName = selectedContact.name ||
                `${firstName} ${lastName}`.trim() ||
                "İsimsiz Kişi";

            setUpdatedTicket((prev: any) => ({
                ...prev,
                contact_id: value,
                customer_name: contactName,
                customer_email: selectedContact.email || null,
                customer_phone: selectedContact.phone || null,
                contact_position: selectedContact.position || null
            }))
        }
    }

    // Kategori değiştiğinde
    const handleCategoryChange = (value: string) => {
        setUpdatedTicket((prev: any) => ({
            ...prev,
            category_id: value,
            // Kategori değiştiğinde alt kategori ve grup seçimini sıfırla
            subcategory_id: null,
            group_id: null
        }))
    }

    // Alt kategori değiştiğinde
    const handleSubcategoryChange = (value: string) => {
        setUpdatedTicket((prev: any) => ({
            ...prev,
            subcategory_id: value,
            // Alt kategori değiştiğinde grup seçimini sıfırla
            group_id: null
        }))
    }

    // Grup değiştiğinde
    const handleGroupChange = (value: string) => {
        // Grup değiştiğinde SLA bitiş tarihini hesapla
        const dueDate = calculateDueDate(updatedTicket.created_at, value);

        setUpdatedTicket((prev: any) => {
            return {
                ...prev,
                group_id: value,
                due_date: dueDate ? dueDate.toISOString() : prev.due_date
            };
        });
    }

    // Değişiklikleri kaydet
    const handleSave = async () => {
        if (!updatedTicket || !updatedTicket.id) {
            toast({
                title: "Hata",
                description: "Bilet bilgileri bulunamadı.",
                variant: "destructive"
            })
            return
        }

        // Eğer durum "resolved" veya "closed" ise, zorunlu alanları kontrol et
        if (updatedTicket.status === "resolved" || updatedTicket.status === "closed") {
            if (!updatedTicket.category_id || !updatedTicket.subcategory_id || !updatedTicket.company_id) {
                setValidationError("Lütfen önce Kategori, Alt Kategori ve Firma seçimlerini yapınız.")
                return
            }
        }

        try {
            setIsSaving(true)
            setValidationError(null)

            // Eğer grup seçiliyse SLA bitiş tarihini yeniden hesapla
            let ticketData = { ...updatedTicket };
            if (ticketData.group_id && ticketData.created_at) {
                const dueDate = calculateDueDate(ticketData.created_at, ticketData.group_id);
                if (dueDate) {
                    ticketData.due_date = dueDate.toISOString();
                }
            }

            // Kategori bilgilerini ekleyelim
            ticketData = {
                ...ticketData,
                id: ticketData.id,
                category_id: ticketData.category_id || null,
                subcategory_id: ticketData.subcategory_id || null,
                group_id: ticketData.group_id || null
            }

            const updatedTicketData = await TicketService.updateTicket(ticketData)

            if (updatedTicketData) {
                toast({
                    title: "Başarılı",
                    description: "Bilet başarıyla güncellendi.",
                })

                if (onTicketUpdate) {
                    onTicketUpdate(updatedTicketData)
                }

                if (updatedTicketData.status === "resolved" || updatedTicketData.status === "closed") {
                    removeResolvedClosedTickets('Tüm Talepler');

                    // Başarı mesajı göster
                    toast({
                        title: "Bilgi",
                        description: `Bilet ${updatedTicketData.status === "resolved" ? "çözümlendi" : "kapalı"} olarak işaretlendi ve listeden kaldırıldı.`,
                        variant: "default",
                    })

                    // Bilet güncellemesi tamamlandıktan sonra sekmeyi kapat ve bilet listesine dön
                    const tabId = updatedTicketData.id ? `ticket-${updatedTicketData.id}` : `ticket-detail-${updatedTicketData.id}`;
                    removeTab(tabId);
                    setActiveTab('Tüm Talepler');
                }
            }
        } catch (error: any) {
            console.error("Bilet güncellenirken hata oluştu:", error)

            // Validasyon hatası kontrolü
            if (error.response?.data?.message) {
                setValidationError(error.response.data.message)
            } else {
                toast({
                    title: "Hata",
                    description: "Bilet güncellenirken bir hata oluştu.",
                    variant: "destructive",
                })
            }
        } finally {
            setIsSaving(false)
        }
    }

    // Çözümlendi olarak kapat butonuna tıklandığında
    const handleResolveClick = () => {
        // Zorunlu alanları kontrol et
        if (!updatedTicket.category_id || !updatedTicket.subcategory_id || !updatedTicket.company_id) {
            setValidationError("Lütfen önce Kategori, Alt Kategori ve Firma seçimlerini yapınız.")
            return
        }

        setValidationError(null)
        setIsResolveModalOpen(true)
    }

    // Çözüm modalında etiket ekle
    const handleAddResolutionTag = () => {
        if (!newTag.trim()) return

        // Eğer bu etiket zaten varsa ekleme
        if (resolutionTags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
            toast({
                title: "Uyarı",
                description: "Bu etiket zaten eklenmiş",
                variant: "default",
            })
            return
        }

        // Yeni etiket ekle (geçici olarak id oluştur)
        const tempTag = {
            id: `temp-${Date.now()}`,
            name: newTag.trim(),
            isNew: true // Yeni eklenen etiketleri işaretlemek için
        }

        setResolutionTags([...resolutionTags, tempTag])
        setNewTag("")
    }

    // Çözüm modalında etiket kaldır
    const handleRemoveResolutionTag = (tagToRemove: any) => {
        setResolutionTags(resolutionTags.filter(tag => tag.id !== tagToRemove.id))
    }

    // Çözüm modalında kaydet
    const handleResolveTicket = async () => {
        if (!resolutionDetails.trim()) {
            toast({
                title: "Hata",
                description: "Lütfen çözüm detaylarını giriniz",
                variant: "destructive",
            })
            return
        }

        setIsResolvingTicket(true)
        try {
            // Bileti çözümlendi olarak güncelle - yeni resolveTicket API'sini kullan
            const resolvedTicket = await TicketService.resolveTicket({
                id: updatedTicket.id,
                resolution_notes: resolutionDetails, // Çözüm detaylarını ekle
                tags: resolutionTags.map(tag => tag.name) // Etiketleri güncelle
            })

            // Başarılı olursa bileti güncelle
            onTicketUpdate({
                ...ticket,
                ...resolvedTicket,
                status: "resolved"
            })

            // Modalı kapat
            setIsResolveModalOpen(false)
            setResolutionDetails("")

            // Başarı mesajı göster
            toast({
                title: "Başarılı",
                description: "Bilet başarıyla çözümlendi olarak kapatıldı",
                variant: "default",
            })

            // Bilet güncellemesi tamamlandıktan sonra sekmeyi kapat ve bilet listesine dön
            const tabId = ticket.id ? `ticket-${ticket.id}` : `ticket-detail-${ticket.id}`;
            removeTab(tabId);
            setActiveTab('Tüm Talepler');

            removeResolvedClosedTickets('Tüm Talepler');
        } catch (error: any) {
            console.error('Bilet çözümlenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Bilet çözümlenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsResolvingTicket(false)
        }
    }

    // Combobox için firma seçeneklerini hazırla - daha güvenli bir şekilde ve uzun metinler için kısaltma yap
    const companyOptions = React.useMemo(() => {
        if (!Array.isArray(companies)) {
            return [];
        }

        const options = companies.map(company => {
            const companyName = company.name || "İsimsiz Firma";
            // Eğer isim çok uzunsa, kısalt
            const displayName = companyName.length > 30 ? companyName.substring(0, 27) + '...' : companyName;

            return {
                value: company.id || "",
                label: displayName
            };
        });

        return options;
    }, [companies]);

    // Combobox için kişi seçeneklerini hazırla - daha güvenli bir şekilde
    const contactOptions = React.useMemo(() => {

        if (!Array.isArray(contacts)) {
            return [];
        }

        const options = contacts.map(contact => {

            // Contact nesnesinde name özelliği olmayabilir, bu durumda firstName ve lastName kullan
            const firstName = contact.firstName || contact.first_name || '';
            const lastName = contact.lastName || contact.last_name || '';

            const contactName = contact.name ||
                `${firstName} ${lastName}`.trim() ||
                "İsimsiz Kişi";

            return {
                value: contact.id || "",
                label: contactName
            };
        });

        return options;
    }, [contacts]);

    // Combobox için durum seçenekleri
    const statusOptions = [
        { value: "open", label: "Açık" },
        { value: "in_progress", label: "İşlemde" },
        { value: "waiting", label: "Beklemede" },
        { value: "closed", label: "Kapalı" },
        { value: "resolved", label: "Çözümlendi" }
    ]

    // Combobox için öncelik seçenekleri
    const priorityOptions = [
        { value: "low", label: "Düşük" },
        { value: "medium", label: "Orta" },
        { value: "high", label: "Yüksek" },
        { value: "urgent", label: "Acil" }
    ]

    // Combobox için atanan kişi seçenekleri
    const assignedToOptions = React.useMemo(() => {

        if (!Array.isArray(users)) {
            return [];
        }

        const options = users.map(user => {
            return {
                value: user.id || "",
                label: user.name || "İsimsiz Kullanıcı"
            };
        });

        return options;
    }, [users]);

    // Firma araması için filtreleme fonksiyonu
    const handleCompanyInputChange = (inputValue: string) => {
        setCompanySearch(inputValue);

        if (!Array.isArray(companies)) {
            setFilteredCompanies([]);
            return;
        }

        if (!inputValue) {
            // Boş arama durumunda ilk 100 firmayı göster
            setFilteredCompanies(companies.slice(0, 100));
            return;
        }

        // Arama terimine göre filtrele
        const filtered = companies.filter(company =>
            company.name?.toLowerCase().includes(inputValue.toLowerCase())
        );

        setFilteredCompanies(filtered);
    };

    // Sayfa yüklendiğinde ilk 100 firmayı göster
    useEffect(() => {
        if (Array.isArray(companies) && companies.length > 0) {
            setFilteredCompanies(companies.slice(0, 100));
        }
    }, [companies]);

    // Bilet yüklenmemişse
    if (!ticket) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col w-full overflow-hidden">
            <Card className="flex-1 overflow-hidden max-w-full">
                <ScrollArea className="h-[calc(90vh-80px)]">
                    <div className="p-3 md:p-6 space-y-4 max-w-full mb-4">
                        <div>
                            <h3 className="text-sm font-semibold mb-2">Durum</h3>
                            <div className="flex items-start space-x-2">
                                <Flag className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                <div className="w-full relative">
                                    <ReactSelect
                                        options={statusOptions}
                                        value={statusOptions.find(option => option.value === updatedTicket?.status)}
                                        onChange={(option) => handleStatusChange(option?.value)}
                                        placeholder="Seçiniz"
                                        className="w-full max-w-full"
                                        classNames={selectClassNames}
                                        styles={selectStyles}
                                        menuPortalTarget={menuPortalTarget}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">Öncelik</h3>
                            <div className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                <div className="w-full relative">
                                    <ReactSelect
                                        options={priorityOptions}
                                        value={priorityOptions.find(option => option.value === updatedTicket?.priority)}
                                        onChange={(option) => handlePriorityChange(option?.value)}
                                        placeholder="Seçiniz"
                                        className="w-full max-w-full"
                                        classNames={selectClassNames}
                                        styles={selectStyles}
                                        menuPortalTarget={menuPortalTarget}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">Atanan Kişi</h3>
                            {loadingUsers ? (
                                <div className="flex items-center space-x-2 p-2 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-xs text-gray-500">Kullanıcılar yükleniyor...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start space-x-2">
                                        <User className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                        <div className="w-full relative">
                                            <ReactSelect
                                                options={assignedToOptions}
                                                value={assignedToOptions.find(option => option.value === updatedTicket?.assigned_to)}
                                                onChange={(option) => handleAssignedToChange(option?.value)}
                                                placeholder="Seçiniz"
                                                className="w-full max-w-full"
                                                classNames={selectClassNames}
                                                styles={selectStyles}
                                                menuPortalTarget={menuPortalTarget}
                                            />
                                        </div>
                                    </div>
                                    {updatedTicket?.assigned_to && updatedTicket?.assigned_user_name && (
                                        <div className="mt-2 text-xs md:text-sm text-gray-500 ml-6">
                                            <span>Atanan: </span>
                                            <span className="font-medium">{updatedTicket.assigned_user_name}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">Firma</h3>
                            {loadingCompanies ? (
                                <div className="flex items-center space-x-2 p-2 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-xs text-gray-500">Firmalar yükleniyor...</span>
                                </div>
                            ) : (
                                <div className="flex items-start space-x-2">
                                    <Building className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                    <div className="w-full relative">
                                        <ReactSelect
                                            options={filteredCompanies.map(company => ({
                                                value: company.id,
                                                label: company.name
                                            }))}
                                            value={companyOptions.find(option => option.value === updatedTicket?.company_id)}
                                            onChange={(option) => handleCompanyChange(option?.value)}
                                            onInputChange={handleCompanyInputChange}
                                            placeholder="Seçiniz"
                                            className="w-full max-w-full"
                                            classNames={selectClassNames}
                                            styles={selectStyles}
                                            menuPortalTarget={menuPortalTarget}
                                            isClearable
                                            filterOption={() => true}
                                            noOptionsMessage={() => "Firma bulunamadı"}
                                            loadingMessage={() => "Yükleniyor..."}
                                            isLoading={loadingCompanies}
                                            components={{
                                                LoadingIndicator: () => (
                                                    <div className="flex items-center">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    </div>
                                                )
                                            }}
                                        />
                                        {companies.length > 100 && companySearch.length === 0 && (
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                                <Search className="h-3 w-3 mr-1" />
                                                <span>Aramak için yazmaya başlayın (toplam {companies.length} firma)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">İletişim Kişisi</h3>
                            {loadingContacts || loadingContactInfo ? (
                                <div className="flex items-center space-x-2 p-2 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-xs text-gray-500">Kişi bilgileri yükleniyor...</span>
                                </div>
                            ) : (
                                <div className="border rounded-md p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-medium text-gray-500">İletişim Bilgileri</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => setIsEditingContact(!isEditingContact)}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            {isEditingContact ? (
                                                <Input
                                                    value={contactInfo.phone}
                                                    onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                                                    className="h-7 text-sm"
                                                    placeholder="Telefon"
                                                />
                                            ) : (
                                                <span className="text-sm">{contactInfo.phone || "Telefon bilgisi yok"}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            {isEditingContact ? (
                                                <Input
                                                    value={contactInfo.name}
                                                    onChange={(e) => handleContactInfoChange('name', e.target.value)}
                                                    className="h-7 text-sm"
                                                    placeholder="Ad Soyad"
                                                />
                                            ) : (
                                                <span className="text-sm">{contactInfo.name || "İsim bilgisi yok"}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            {isEditingContact ? (
                                                <Input
                                                    value={contactInfo.position}
                                                    onChange={(e) => handleContactInfoChange('position', e.target.value)}
                                                    className="h-7 text-sm"
                                                    placeholder="Pozisyon"
                                                />
                                            ) : (
                                                <span className="text-sm">{contactInfo.position || "Pozisyon bilgisi yok"}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            {isEditingContact ? (
                                                <Input
                                                    value={contactInfo.email}
                                                    onChange={(e) => handleContactInfoChange('email', e.target.value)}
                                                    className="h-7 text-sm"
                                                    placeholder="E-posta"
                                                />
                                            ) : (
                                                <span className="text-sm">{contactInfo.email || "E-posta bilgisi yok"}</span>
                                            )}
                                        </div>
                                    </div>

                                    {isEditingContact && (
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => setIsEditingContact(false)}
                                            >
                                                Tamam
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Kategori */}
                        <div className="space-y-4 z-999">
                            <CategoryForm
                                categoryId={updatedTicket?.category_id}
                                subcategoryId={updatedTicket?.subcategory_id}
                                groupId={updatedTicket?.group_id}
                                onCategoryIdChange={handleCategoryChange}
                                onSubcategoryIdChange={handleSubcategoryChange}
                                onGroupIdChange={handleGroupChange}
                            />
                        </div>

                        {/*Şuanlık Buraya Gerek Yok {(updatedTicket?.customer_name || updatedTicket?.contact_name) && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">Müşteri Bilgileri</h3>
                                <div className="space-y-2 max-w-full overflow-hidden">
                                    {(updatedTicket?.customer_name || updatedTicket?.contact_name) && (
                                        <div className="flex items-center text-xs md:text-sm max-w-full">
                                            <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">
                                                {updatedTicket?.customer_name || updatedTicket?.contact_name}
                                            </span>
                                        </div>
                                    )}
                                    {(updatedTicket?.customer_email || updatedTicket?.contact_email) && (
                                        <div className="flex items-center text-xs md:text-sm max-w-full">
                                            <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">
                                                {updatedTicket?.customer_email || updatedTicket?.contact_email}
                                            </span>
                                        </div>
                                    )}
                                    {(updatedTicket?.customer_phone || updatedTicket?.contact_phone) && (
                                        <div className="flex items-center text-xs md:text-sm max-w-full">
                                            <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">
                                                {updatedTicket?.customer_phone || updatedTicket?.contact_phone}
                                            </span>
                                        </div>
                                    )}
                                    {(updatedTicket?.contact_position) && (
                                        <div className="flex items-center text-xs md:text-sm max-w-full">
                                            <Building2 className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">{updatedTicket?.contact_position}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )} */}

                        {/* Etiketler Bölümü */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Etiketler</h3>
                            {loadingTags ? (
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-xs text-gray-500">Etiketler yükleniyor...</span>
                                </div>
                            ) : tags && tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className={`text-xs px-2 py-1 ${getTagColor(tag.id)}`}
                                        >
                                            <TagIcon className="h-3 w-3 mr-1" />
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500">Etiket bulunamadı</div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Tarih Bilgileri</h3>
                            <div className="space-y-2 max-w-full overflow-hidden">
                                {updatedTicket.created_at && (
                                    <div className="flex items-center text-xs md:text-sm max-w-full">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                        <span className="truncate max-w-[calc(100%-2rem)]">
                                            Oluşturulma: {format(new Date(updatedTicket.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                )}
                                {updatedTicket.updated_at && (
                                    <div className="flex items-center text-xs md:text-sm max-w-full">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                        <span className="truncate max-w-[calc(100%-2rem)]">
                                            Güncelleme: {format(new Date(updatedTicket.updated_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                )}
                                {updatedTicket.due_date && (
                                    <div className="flex items-center text-xs md:text-sm max-w-full">
                                        <Clock className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                                        <span className="truncate max-w-[calc(100%-2rem)] font-medium">
                                            SLA Bitiş: {format(new Date(updatedTicket.due_date), 'd MMMM yyyy HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="sticky bottom-6 p-3 md:p-4 bg-background border-t space-y-2">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Değişiklikleri Kaydet
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleResolveClick}
                            disabled={isSaving || isResolvingTicket}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Çözümlendi olarak Kapat
                        </Button>

                        {validationError && (
                            <div className="text-xs text-red-500 mt-1">{validationError}</div>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Çözüm Modalı */}
            <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bileti Çözümlendi olarak Kapat</DialogTitle>
                        <DialogDescription>
                            Çözüm için yapılan işlemleri detaylı olarak açıklayınız. Bu bilgiler müşteri ve ekip üyeleri için önemlidir.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2">
                        <div className="space-y-2">
                            <Label htmlFor="resolution-details">Çözüm Detayları</Label>
                            <Textarea
                                id="resolution-details"
                                placeholder="Çözüm için ne yaptığınızı lütfen detaylı olarak yazınız..."
                                value={resolutionDetails}
                                onChange={(e) => setResolutionDetails(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Etiketler</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {resolutionTags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        variant="outline"
                                        className={`text-xs px-2 py-1 ${getTagColor(tag.id)} flex items-center`}
                                    >
                                        <TagIcon className="h-3 w-3 mr-1" />
                                        {tag.name}
                                        <button
                                            onClick={() => handleRemoveResolutionTag(tag)}
                                            className="ml-1 hover:text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Yeni etiket ekle..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddResolutionTag()
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleAddResolutionTag}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResolveModalOpen(false)}
                            disabled={isResolvingTicket}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleResolveTicket}
                            disabled={isResolvingTicket}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isResolvingTicket ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Çözümlendi olarak Kapat
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}