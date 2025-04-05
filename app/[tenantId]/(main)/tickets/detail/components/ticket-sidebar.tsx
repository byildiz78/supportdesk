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
    Edit,
    RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TicketService } from "../services/ticket-service"
import { AuditService } from "@/app/[tenantId]/(main)/services/audit-service"
import { StatusHistoryService } from "@/app/[tenantId]/(main)/services/status-history-service"
import { useCompanies } from "@/providers/companies-provider"
import { useUsers } from "@/providers/users-provider"
import { useContacts } from "@/providers/contacts-provider"
import { Group, useCategories } from "@/providers/categories-provider"
import { toast } from "@/components/ui/toast/use-toast"
import { useTabStore } from "@/stores/tab-store"
import { useTicketStore } from "@/stores/ticket-store"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import CategoryForm from "../../components/CategoryForm"
import ReactSelect from "react-select"
import axios from "@/lib/axios"
import { getUserId, getUserName } from "@/utils/user-utils"

interface TicketSidebarProps {
    ticket: any;
    onTicketUpdate: (updatedTicket: any) => void;
}

// Her ticket için iletişim bilgilerini saklayacak global obje
const ticketContactInfo: Record<string, {
    name: string;
    position: string;
    email: string;
    phone: string;
}> = {};

export function TicketSidebar({ ticket, onTicketUpdate }: TicketSidebarProps) {
    const { companies, loading: loadingCompanies } = useCompanies()
    const { users, isLoading: loadingUsers, refetchUsers } = useUsers()
    const { contacts, loading: loadingContacts } = useContacts()
    const { categories, loading: loadingCategories, groups } = useCategories()
    const { removeResolvedClosedTickets } = useTicketStore();
    const [updatedTicket, setUpdatedTicket] = useState<any>(ticket || {})
    const [isSaving, setIsSaving] = useState(false)
    const { removeTab, setActiveTab, previousActiveTab } = useTabStore();
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
    // Light/Dark mode uyumlu React Select stiller
    // Bu yaklaşım theme-provider ile entegre çalışır

    const selectClassNames = {
        control: (state) => `w-full bg-background/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-150 rounded-md h-8 px-2 py-1 flex items-center justify-between ${state.isFocused ? 'border-primary ring-1 ring-primary' : ''}`,
        menu: () => "bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-md mt-1 z-50 dark:bg-slate-950 dark:border-slate-800",
        menuList: () => "py-1 px-1",
        option: (state) => `cursor-pointer transition-colors py-1.5 px-2 rounded-sm text-xs flex items-center ${state.isFocused ? 'bg-accent text-accent-foreground dark:bg-slate-800 dark:text-white' : ''} ${state.isSelected ? 'bg-primary text-primary-foreground font-medium' : ''}`,
        singleValue: () => "text-foreground dark:text-white flex items-center text-xs",
        placeholder: () => "text-muted-foreground dark:text-slate-400 text-xs",
        valueContainer: () => "flex items-center gap-1"
    }

    // Özel stiller
    const selectStyles = {
        control: (base) => ({
            ...base,
            boxShadow: 'none',
            minHeight: '32px'
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: 'var(--foreground)',
            opacity: 0.5,
            padding: '0 4px'
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: '0 4px'
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 6px'
        })
    }

    // Select tema ayarları
    const selectTheme = (theme) => ({
        ...theme,
        colors: {
            ...theme.colors,
            primary: 'var(--primary)',
            primary25: 'var(--accent)',
            neutral0: 'var(--background)',
            neutral80: 'var(--foreground)'
        }
    })

    // Bilet değiştiğinde updatedTicket'ı güncelle
    useEffect(() => {
        if (ticket) {
            setUpdatedTicket(ticket)
            if (ticket.id) {
                fetchTags(ticket.id)
            }

            // Eğer bu ticket için daha önce iletişim bilgisi kaydedilmişse, onu kullan
            if (ticket.id && ticketContactInfo[ticket.id]) {
                setContactInfo(ticketContactInfo[ticket.id]);
            } else {
                // Ticket'ta telefon numarası veya email varsa kişi bilgilerini getir
                if (ticket.customer_phone || ticket.customer_email) {
                    fetchContactInfo(ticket.customer_phone, ticket.customer_email)
                } else {
                    // Kişi bilgisi yoksa contact info'yu temizle
                    const newContactInfo = {
                        name: ticket.customer_name || "",
                        position: ticket.contact_position || "",
                        email: ticket.customer_email || "",
                        phone: ticket.customer_phone || ""
                    };

                    setContactInfo(newContactInfo);
                    // Ticket için iletişim bilgisini kaydet
                    if (ticket.id) {
                        ticketContactInfo[ticket.id] = newContactInfo;
                    }
                }
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
                const newContactInfo = {
                    name: contactData.name || "",
                    position: contactData.position || "",
                    email: contactData.email || "",
                    phone: contactData.phone || phoneNumber || ""
                };

                setContactInfo(newContactInfo);
                // Ticket için iletişim bilgisini kaydet
                if (ticket.id) {
                    ticketContactInfo[ticket.id] = newContactInfo;
                }

                // Ticket'ı da güncelle
                setUpdatedTicket((prev: any) => ({
                    ...prev,
                    customer_name: contactData.name || prev.customer_name,
                    customer_email: contactData.email || prev.customer_email,
                    contact_position: contactData.position || prev.contact_position
                }))
            } else {
                // Kişi bulunamadıysa sadece telefon numarasını veya email'i ayarla
                const newContactInfo = {
                    name: updatedTicket.customer_name || "",
                    position: updatedTicket.contact_position || "",
                    email: updatedTicket.customer_email || email || "",
                    phone: phoneNumber || ""
                };

                setContactInfo(newContactInfo);
                // Ticket için iletişim bilgisini kaydet
                if (ticket.id) {
                    ticketContactInfo[ticket.id] = newContactInfo;
                }
            }
        } catch (error) {
            console.error("Kişi bilgileri alınırken hata oluştu:", error)
            // Hata durumunda mevcut bilgileri kullan
            const newContactInfo = {
                name: updatedTicket.customer_name || "",
                position: updatedTicket.contact_position || "",
                email: updatedTicket.customer_email || email || "",
                phone: phoneNumber || ""
            };

            setContactInfo(newContactInfo);
            // Ticket için iletişim bilgisini kaydet
            if (ticket.id) {
                ticketContactInfo[ticket.id] = newContactInfo;
            }
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

    // Telefon numarasını formatlama ve +90 ön eki ekleme
    const handlePhoneChange = (value: string) => {
        // Telefon numarasından tüm boşlukları, tireleri ve parantezleri kaldır
        let cleanedNumber = value.replace(/[\s\-()]/g, '');
        
        // Eğer numara +90 ile başlıyorsa, olduğu gibi bırak
        if (cleanedNumber.startsWith('+90')) {
            handleContactInfoChange('phone', cleanedNumber);
            return;
        }
        
        // Eğer numara 90 ile başlıyorsa ve 12 haneliyse (90XXXXXXXXXX), +90 ekle
        if (cleanedNumber.startsWith('90') && cleanedNumber.length === 12) {
            handleContactInfoChange('phone', '+' + cleanedNumber);
            return;
        }
        
        // Eğer numara 0 ile başlıyorsa, 0'ı kaldır ve +90 ekle
        if (cleanedNumber.startsWith('0') && cleanedNumber.length > 1) {
            cleanedNumber = cleanedNumber.substring(1);
            handleContactInfoChange('phone', '+90' + cleanedNumber);
            return;
        }
        
        // Eğer numara 10 veya 11 haneliyse ve yukarıdaki koşullardan hiçbirine uymuyorsa
        // (05XXXXXXXXX veya 5XXXXXXXXX gibi)
        if (cleanedNumber.length >= 10) {
            // Eğer 11 haneliyse ve 0 ile başlıyorsa (05XXXXXXXXX), 0'ı kaldır
            if (cleanedNumber.length === 11 && cleanedNumber.startsWith('0')) {
                cleanedNumber = cleanedNumber.substring(1);
            }
            
            // Eğer 10 haneliyse (5XXXXXXXXX), +90 ekle
            if (cleanedNumber.length === 10) {
                handleContactInfoChange('phone', '+90' + cleanedNumber);
                return;
            }
        }
        
        // Diğer durumlarda değeri olduğu gibi güncelle
        handleContactInfoChange('phone', value);
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

    // Kategori bilgileri değiştiğinde SLA hesaplamayı tetikle
    useEffect(() => {
        if (ticket && ticket.category_id && ticket.subcategory_id && ticket.group_id) {

            // Due date hesaplaması yap
            const calculatedDueDate = calculateDueDate(
                ticket.created_at || ticket.createdAt,
                ticket.group_id || ticket.groupId
            );

            // Eğer hesaplanan tarih varsa ve mevcut due date farklıysa güncelle
            if (calculatedDueDate && (!ticket.due_date || new Date(ticket.due_date).getTime() !== calculatedDueDate.getTime())) {

                // Form state'ini güncelle
                setUpdatedTicket((prev: any) => ({
                    ...prev,
                    due_date: calculatedDueDate.toISOString(),
                }));

                // Ana ticket verilerini de güncelle
                if (onTicketUpdate) {
                    onTicketUpdate({
                        ...ticket,
                        due_date: calculatedDueDate.toISOString()
                    });
                }
            }
        }
    }, [ticket?.category_id, ticket?.subcategory_id, ticket?.group_id]);

    // Durum değiştiğinde
    const handleStatusChange = (value: string) => {
        // Önceki durumu sakla (audit log için)
        const previousStatus = updatedTicket.status;

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
        // Önceki atanan kişiyi sakla (audit log için)
        const previousAssignee = updatedTicket.assigned_to;
        const previousAssigneeName = updatedTicket.assigned_user_name;

        // Atanan kişinin adını bul
        const selectedUser = users.find(user => user.id === value);
        const userName = selectedUser ? selectedUser.name : "Bilinmeyen Kullanıcı";

        setUpdatedTicket((prev: any) => {
            return {
                ...prev,
                assigned_to: value,
                assigned_user_name: userName
            };
        });

        // Atanan kişi değişikliğini ticket history'ye kaydet
        if (ticket.id && previousAssignee !== value) {
            StatusHistoryService.createAssignmentHistoryEntry(
                ticket.id,
                previousAssignee,
                value,
                previousAssigneeName,
                userName
            ).catch(error => {
                console.error("Atanan kişi değişikliği kaydedilirken hata:", error);
            });
        }
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

            // Şirket değişikliğini hemen ana bileşene bildir
            onTicketUpdate(updated);
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

            // Şirket değişikliğini hemen ana bileşene bildir
            onTicketUpdate(updated);
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

            // Orijinal bilet durumunu sakla (audit log için)
            const originalTicket = { ...ticket };
            const statusChanged = originalTicket.status !== updatedTicket.status;
            const assignmentChanged = originalTicket.assigned_to !== updatedTicket.assigned_to;

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
                // Durum değişikliği varsa audit log oluştur
                if (statusChanged) {
                    try {
                        await AuditService.logTicketStatusChange(
                            updatedTicketData.id,
                            originalTicket.status,
                            updatedTicketData.status,
                            {
                                status: originalTicket.status,
                                priority: originalTicket.priority,
                                assigned_to: originalTicket.assigned_to,
                                category_id: originalTicket.category_id,
                                subcategory_id: originalTicket.subcategory_id,
                                group_id: originalTicket.group_id
                            },
                            {
                                status: updatedTicketData.status,
                                priority: updatedTicketData.priority,
                                assigned_to: updatedTicketData.assigned_to,
                                category_id: updatedTicketData.category_id,
                                subcategory_id: updatedTicketData.subcategory_id,
                                group_id: updatedTicketData.group_id
                            }
                        );

                        // Durum geçmişi tablosuna kaydet
                        await StatusHistoryService.createStatusHistoryEntry(
                            updatedTicketData.id,
                            originalTicket.status,
                            updatedTicketData.status
                        );
                    } catch (logError) {
                        console.error("Durum değişikliği log oluşturulurken hata:", logError);
                        // Log hatası bilet güncellemeyi etkilemeyecek
                    }
                }

                // Kategori, alt kategori veya grup değişikliği varsa kaydet
                const categoryChanged =
                    originalTicket.category_id !== updatedTicketData.category_id ||
                    originalTicket.subcategory_id !== updatedTicketData.subcategory_id ||
                    originalTicket.group_id !== updatedTicketData.group_id;

                if (categoryChanged) {
                    try {
                        // Kategori değişikliklerini kaydet
                        await StatusHistoryService.createCategoryHistoryEntry(
                            updatedTicketData.id,
                            {
                                category_id: originalTicket.category_id || null,
                                subcategory_id: originalTicket.subcategory_id || null,
                                group_id: originalTicket.group_id || null
                            },
                            {
                                category_id: updatedTicketData.category_id || null,
                                subcategory_id: updatedTicketData.subcategory_id || null,
                                group_id: updatedTicketData.group_id || null
                            }
                        );
                    } catch (logError) {
                        console.error("Kategori değişikliği log oluşturulurken hata:", logError);
                        // Log hatası bilet güncellemeyi etkilemeyecek
                    }
                }

                // Görevlendirme değişikliği varsa audit log oluştur
                if (assignmentChanged) {
                    try {
                        await AuditService.logTicketAssignmentChange(
                            updatedTicketData.id,
                            originalTicket.assigned_to,
                            updatedTicketData.assigned_to,
                            {
                                status: originalTicket.status,
                                priority: originalTicket.priority,
                                assigned_to: originalTicket.assigned_to,
                                assigned_user_name: originalTicket.assigned_user_name,
                                category_id: originalTicket.category_id,
                                subcategory_id: originalTicket.subcategory_id,
                                group_id: originalTicket.group_id
                            },
                            {
                                status: updatedTicketData.status,
                                priority: updatedTicketData.priority,
                                assigned_to: updatedTicketData.assigned_to,
                                assigned_user_name: updatedTicketData.assigned_user_name,
                                category_id: updatedTicketData.category_id,
                                subcategory_id: updatedTicketData.subcategory_id,
                                group_id: updatedTicketData.group_id
                            }
                        );
                    } catch (logError) {
                        console.error("Görevlendirme değişikliği log kaydı oluşturulurken hata:", logError);
                        // Audit log hatası bilet güncellemeyi etkilemeyecek
                    }
                }

                toast({
                    title: "Başarılı",
                    description: "Bilet başarıyla güncellendi.",
                })

                // İletişim bilgilerini güncelle ve kaydet
                if (ticket.id) {
                    ticketContactInfo[ticket.id] = contactInfo;
                }

                // Ana bileşene güncellemeyi bildir
                if (onTicketUpdate) {
                    onTicketUpdate(updatedTicketData)
                }

                // Değişiklikleri Kaydet Butonu Kullanıldığında TAB kapatılmaz Güncellenir.
                // if (updatedTicketData.status === "resolved" || updatedTicketData.status === "closed") {
                //     removeResolvedClosedTickets('Tüm Talepler');

                //     // Başarı mesajı göster
                //     toast({
                //         title: "Bilgi",
                //         description: `Bilet ${updatedTicketData.status === "resolved" ? "çözümlendi" : "kapalı"} olarak işaretlendi ve listeden kaldırıldı.`,
                //         variant: "default",
                //     })

                //     // Bilet güncellemesi tamamlandıktan sonra sekmeyi kapat ve bilet listesine dön
                //     const tabId = updatedTicketData.id ? `ticket-${updatedTicketData.id}` : `ticket-detail-${updatedTicketData.id}`;
                //     removeTab(tabId);
                //     setActiveTab('Tüm Talepler');
                // }
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
            // Önce yapılan tüm değişiklikleri kaydet
            // Eğer değişiklik yapılmışsa (validationError yoksa) handleSave fonksiyonunu çağır
            if (JSON.stringify(ticket) !== JSON.stringify(updatedTicket) && !validationError) {
                // Değişiklikleri kaydet
                await handleSave();

                // Eğer kaydetme sırasında bir hata olursa, çözümleme işlemini durdur
                if (validationError) {
                    setIsResolvingTicket(false);
                    return;
                }
            }

            // Orijinal bilet durumunu sakla (audit log için)
            const originalTicket = { ...ticket };

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

            // Durum değişikliğini audit log'a kaydet
            try {
                await AuditService.logTicketStatusChange(
                    updatedTicket.id,
                    originalTicket.status,
                    "resolved",
                    {
                        status: originalTicket.status,
                        priority: originalTicket.priority,
                        assigned_to: originalTicket.assigned_to,
                        category_id: originalTicket.category_id,
                        subcategory_id: originalTicket.subcategory_id,
                        group_id: originalTicket.group_id
                    },
                    {
                        status: "resolved",
                        priority: resolvedTicket.priority || originalTicket.priority,
                        assigned_to: resolvedTicket.assigned_to || originalTicket.assigned_to,
                        category_id: resolvedTicket.category_id || originalTicket.category_id,
                        subcategory_id: resolvedTicket.subcategory_id || originalTicket.subcategory_id,
                        group_id: resolvedTicket.group_id || originalTicket.group_id,
                        resolution_notes: resolutionDetails,
                        resolution_tags: resolutionTags.map(tag => tag.name)
                    }
                );

                // Durum geçmişi tablosuna kaydet
                await StatusHistoryService.createStatusHistoryEntry(
                    updatedTicket.id,
                    originalTicket.status,
                    "resolved"
                );
            } catch (logError) {
                console.error("Audit log oluşturulurken hata:", logError);
                // Audit log hatası bilet çözümlemeyi etkilemeyecek
            }

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

            // Bilet durumuna göre uygun taba yönlendir
            // Eğer önceki aktif tab varsa, o taba dön
            if (previousActiveTab) {
                setActiveTab(previousActiveTab);
                removeResolvedClosedTickets(previousActiveTab);
            } else {
                // Önceki tab yoksa, bilet durumuna göre yönlendir
                if (originalTicket.status === "resolved" || originalTicket.status === "closed") {
                    setActiveTab('Çözülen Talepler');
                    removeResolvedClosedTickets('Çözülen Talepler');
                } else if (originalTicket.status === "pending" || originalTicket.status === "waiting") {
                    setActiveTab('Bekleyen Talepler');
                    removeResolvedClosedTickets('Bekleyen Talepler');
                } else {
                    setActiveTab('Tüm Talepler');
                    removeResolvedClosedTickets('Tüm Talepler');
                }
            }
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
        // { value: "closed", label: "Kapalı" },
        // { value: "resolved", label: "Çözümlendi" }
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
                    <div className="p-3 md:p-6 space-y-3 max-w-full mb-4">
                        {/* Firma, İletişim Kişisi ve Atanan Kişi - Birleştirilmiş */}
                        <div className="border rounded-md p-2 space-y-3">
                            {/* Firma */}
                            <div>
                                <h3 className="text-sm font-semibold mb-1.5">Firma</h3>
                                {loadingCompanies ? (
                                    <div className="flex items-center space-x-2">
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
                                                unstyled
                                                theme={selectTheme}
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
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* İletişim Kişisi */}
                            <div>
                                {loadingContacts || loadingContactInfo ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-xs text-gray-500">Kişi bilgileri yükleniyor...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 mt-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">İletişim Kişisi Bilgileri</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => setIsEditingContact(!isEditingContact)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="space-y-1.5">
                                            {isEditingContact ? (
                                                <>
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <Input
                                                            value={contactInfo.phone}
                                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                                            className="h-7 text-sm"
                                                            placeholder="Telefon"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <Input
                                                            value={contactInfo.name}
                                                            onChange={(e) => handleContactInfoChange('name', e.target.value)}
                                                            className="h-7 text-sm"
                                                            placeholder="Ad Soyad"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <Input
                                                            value={contactInfo.email}
                                                            onChange={(e) => handleContactInfoChange('email', e.target.value)}
                                                            className="h-7 text-sm"
                                                            placeholder="E-posta"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <Input
                                                            value={contactInfo.position}
                                                            onChange={(e) => handleContactInfoChange('position', e.target.value)}
                                                            className="h-7 text-sm"
                                                            placeholder="Pozisyon"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end space-x-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs"
                                                            onClick={() => setIsEditingContact(false)}
                                                        >
                                                            İptal
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => setIsEditingContact(false)}
                                                        >
                                                            Tamam
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {contactInfo.phone && (
                                                        <div className="flex items-center text-xs">
                                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                                            <span className="truncate">{contactInfo.phone}</span>
                                                        </div>
                                                    )}
                                                    {contactInfo.name && (
                                                        <div className="flex items-center text-xs">
                                                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                                            <span className="truncate">{contactInfo.name}</span>
                                                        </div>
                                                    )}
                                                    {contactInfo.email && (
                                                        <div className="flex items-center text-xs">
                                                            <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                                            <span className="truncate">{contactInfo.email}</span>
                                                        </div>
                                                    )}
                                                    {contactInfo.position && (
                                                        <div className="flex items-center text-xs">
                                                            <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                                            <span className="truncate">{contactInfo.position}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Atanan Kişi */}
                            <div>
                                <h3 className="text-sm font-semibold mb-1.5 mt-5">Atanan Kişi</h3>
                                {loadingUsers ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-xs text-gray-500">Kullanıcılar yükleniyor...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-1.5">
                                        <div className="flex items-start space-x-2">
                                            <User className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                            <div className="w-full relative">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex-1">
                                                        <ReactSelect
                                                            options={assignedToOptions}
                                                            value={assignedToOptions.find(option => option.value === updatedTicket?.assigned_to)}
                                                            onChange={(option) => handleAssignedToChange(option?.value)}
                                                            placeholder="Seçiniz"
                                                            className="w-full max-w-full"
                                                            classNames={selectClassNames}
                                                            styles={selectStyles}
                                                            menuPortalTarget={menuPortalTarget}
                                                            unstyled
                                                            theme={selectTheme}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 px-2 bg-green-600 hover:bg-green-700 hover:text-white text-white md:text-sm"
                                                onClick={() => {
                                                    const currentUserId = getUserId();
                                                    const currentUserName = getUserName();

                                                    if (currentUserId) {
                                                        handleAssignedToChange(currentUserId);

                                                        toast({
                                                            title: "Bilgi",
                                                            description: "Bilet size devredildi. Değişiklikleri kaydetmek için 'Kaydet' butonuna tıklayın.",
                                                            variant: "default",
                                                        });
                                                    } else {
                                                        toast({
                                                            title: "Hata",
                                                            description: "Kullanıcı bilgisi bulunamadı.",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }}
                                            >
                                                Devir Al
                                            </Button>
                                        </div>
                                        {updatedTicket?.assigned_to && updatedTicket?.assigned_user_name && (
                                            <span className="text-xs text-gray-500">Atanan: {updatedTicket.assigned_user_name}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kategori Bilgileri */}
                        <div className="border rounded-md p-2 space-y-3 z-999">
                            <CategoryForm
                                categoryId={updatedTicket?.category_id}
                                subcategoryId={updatedTicket?.subcategory_id}
                                groupId={updatedTicket?.group_id}
                                onCategoryIdChange={handleCategoryChange}
                                onSubcategoryIdChange={handleSubcategoryChange}
                                onGroupIdChange={handleGroupChange}
                            />
                        </div>

                        {/* Durum */}
                        <div className="border rounded-md p-2 space-y-3">
                            <h3 className="text-sm font-semibold mb-1.5">Durum</h3>
                            <div className="flex items-start space-x-2">
                                <Flag className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                                <div className="w-full relative">
                                    <ReactSelect
                                        options={statusOptions}
                                        value={statusOptions.find(option => option.value === updatedTicket?.status)}
                                        onChange={(option) => handleStatusChange(option?.value)}
                                        placeholder="Seçiniz"
                                        className="w-full max-w-full"
                                        styles={selectStyles}
                                        menuPortalTarget={menuPortalTarget}
                                        classNames={selectClassNames}
                                        unstyled
                                        theme={selectTheme}
                                    />
                                </div>
                            </div>

                            {/* Öncelik */}

                            <h3 className="text-sm font-semibold mb-1.5">Öncelik</h3>
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
                                        unstyled
                                        theme={selectTheme}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Etiketler Bölümü */}
                        <div className="border rounded-md p-2 space-y-3">
                            <h3 className="text-sm font-semibold">Etiketler</h3>
                            {loadingTags ? (
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-xs text-gray-500">Etiketler yükleniyor...</span>
                                </div>
                            ) : tags && tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className={`text-xs px-1.5 py-0.5 ${getTagColor(tag.id)}`}
                                        >
                                            <TagIcon className="h-2.5 w-2.5 mr-1" />
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500">Etiket bulunamadı</div>
                            )}

                            {/* Tarih Bilgileri */}
                            <div className="space-y-1.5">
                                <h3 className="text-sm font-semibold">Tarih Bilgileri</h3>
                                <div className="space-y-1.5 max-w-full overflow-hidden">
                                    {updatedTicket.created_at && (
                                        <div className="flex items-center text-xs max-w-full">
                                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">
                                                Oluşturulma: {format(new Date(updatedTicket.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                                            </span>
                                        </div>
                                    )}
                                    {updatedTicket.updated_at && (
                                        <div className="flex items-center text-xs max-w-full">
                                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)]">
                                                Güncelleme: {format(new Date(updatedTicket.updated_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                                            </span>
                                        </div>
                                    )}
                                    {updatedTicket.due_date && (
                                        <div className="flex items-center text-xs max-w-full">
                                            <Clock className="h-3.5 w-3.5 mr-1.5 text-red-500 flex-shrink-0" />
                                            <span className="truncate max-w-[calc(100%-2rem)] font-medium">
                                                SLA Bitiş: {format(new Date(updatedTicket.due_date), 'd MMMM yyyy HH:mm', { locale: tr })}
                                            </span>
                                        </div>
                                    )}
                                </div>
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
                        {ticket.status !== "resolved" && ticket.status !== "closed" && (
                            <Button
                                onClick={handleResolveClick}
                                disabled={isSaving || isResolvingTicket}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Çözümlendi olarak Kapat
                            </Button>
                        )}
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