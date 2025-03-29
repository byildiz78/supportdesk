"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/toast/use-toast"
import { useCompanies } from "@/providers/companies-provider"
import { useUsers } from "@/providers/users-provider"
import { useContacts } from "@/providers/contacts-provider"
import { useCategories } from "@/providers/categories-provider"
import { useTabStore } from "@/stores/tab-store"
import { useTicketStore } from "@/stores/ticket-store"
import { TicketService } from "../services/ticket-service"
import { AuditService } from "@/app/[tenantId]/(main)/services/audit-service"
import { StatusHistoryService } from "@/app/[tenantId]/(main)/services/status-history-service"
import ReactSelect, { StylesConfig } from "react-select"

// Import components from the ticket-sidebar directory
import CompanySelector from "./ticket-sidebar/CompanySelector"
import ContactInformation from "./ticket-sidebar/ContactInformation"
import AssignedUserSelector from "./ticket-sidebar/AssignedUserSelector"
import TicketCategorySelector from "./ticket-sidebar/TicketCategorySelector"
import TicketStatusSection from "./ticket-sidebar/TicketStatusSection"
import TicketTagsSection from "./ticket-sidebar/TicketTagsSection"
import TicketDatesInfo from "./ticket-sidebar/TicketDatesInfo"
import TicketActions from "./ticket-sidebar/TicketActions"
import ResolveTicketModal from "./ticket-sidebar/ResolveTicketModal"
import { Ticket, ContactInfo, Tag, Category, Subcategory, Group } from "./ticket-sidebar/types"

// Define props interface
interface TicketSidebarProps {
    ticket: Ticket;
    onTicketUpdate: (updatedTicket: any) => void;
}

// Her ticket için iletişim bilgilerini saklayacak global obje
const ticketContactInfo: Record<string, ContactInfo> = {};

const TicketSidebar: React.FC<TicketSidebarProps> = ({ ticket, onTicketUpdate }) => {
    // State for ticket data
    const [updatedTicket, setUpdatedTicket] = useState<Ticket>(ticket);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    // Contact information state
    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        name: "",
        position: "",
        email: "",
        phone: ""
    });
    const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
    const [loadingContactInfo, setLoadingContactInfo] = useState<boolean>(false);
    
    // Resolution modal state
    const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
    const [resolutionDetails, setResolutionDetails] = useState<string>("");
    const [resolutionTags, setResolutionTags] = useState<Tag[]>([]);
    const [newTag, setNewTag] = useState<string>("");
    const [isResolvingTicket, setIsResolvingTicket] = useState<boolean>(false);
    
    // Tags state
    const [tags, setTags] = useState<Tag[]>([]);
    
    // Tab management
    const { removeTab, setActiveTab, previousActiveTab } = useTabStore();
    
    // Data providers
    const { companies } = useCompanies();
    const { users, refetch: refetchUsers } = useUsers();
    const { contacts } = useContacts();
    const { categories, groups } = useCategories();
    
    // Loading states
    const loadingCompanies = false; // These would come from the providers
    const loadingUsers = false;
    const loadingContacts = false;
    const loadingCategories = false;
    
    // Filtered companies for search
    const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
    const [companySearch, setCompanySearch] = useState<string>("");
    
    // Select styling
    const menuPortalTarget = typeof document !== 'undefined' ? document.body : null;
    
    // Select styles and themes
    const selectClassNames = {
        control: () => "border rounded-md px-2 py-1 text-sm min-h-[36px] flex items-center",
        menu: () => "bg-white dark:bg-gray-800 border rounded-md mt-1 shadow-lg z-50",
        menuList: () => "py-1 overflow-y-auto max-h-[200px]",
        option: ({ isFocused, isSelected }: { isFocused: boolean, isSelected: boolean }) => 
            `px-2 py-1.5 text-sm cursor-pointer ${isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''} ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}`,
        singleValue: () => "text-sm",
        placeholder: () => "text-sm text-gray-400",
        noOptionsMessage: () => "text-sm text-gray-500 p-2"
    };
    
    const selectStyles: StylesConfig = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };
    
    const selectTheme = (theme: any) => ({
        ...theme,
        colors: {
            ...theme.colors,
            primary: 'var(--primary)',
            primary75: 'var(--primary-foreground)',
            primary50: 'var(--primary-foreground)',
            primary25: 'var(--primary-foreground)',
        },
    });

    // Effect to update the ticket when it changes
    useEffect(() => {
        setUpdatedTicket(ticket);
    }, [ticket]);

    // Effect to load contact info when ticket changes
    useEffect(() => {
        if (ticket?.id) {
            // Eğer bu bilet için daha önce iletişim bilgisi kaydedilmişse, onu kullan
            if (ticketContactInfo[ticket.id]) {
                setContactInfo(ticketContactInfo[ticket.id]);
            } else {
                // Yoksa bilet üzerindeki telefon veya e-posta ile bilgileri getir
                if (ticket.contact_phone || ticket.contact_email) {
                    fetchContactInfo(ticket.contact_phone, ticket.contact_email);
                } else {
                    // Hiçbir iletişim bilgisi yoksa boş state kullan
                    setContactInfo({
                        name: ticket.contact_name || "",
                        position: ticket.contact_position || "",
                        email: ticket.contact_email || "",
                        phone: ticket.contact_phone || ""
                    });
                    
                    // Global objeye kaydet
                    ticketContactInfo[ticket.id] = {
                        name: ticket.contact_name || "",
                        position: ticket.contact_position || "",
                        email: ticket.contact_email || "",
                        phone: ticket.contact_phone || ""
                    };
                }
            }
        }
    }, [ticket?.id]);

    // Effect to load tags when ticket changes
    useEffect(() => {
        const loadTags = async () => {
            if (ticket?.id) {
                try {
                    const ticketTags = await TicketService.getTicketTags(ticket.id);
                    setTags(ticketTags);
                } catch (error) {
                    console.error("Etiketler yüklenirken hata oluştu:", error);
                }
            }
        };
        
        loadTags();
    }, [ticket?.id]);

    // Effect to initialize filtered companies
    useEffect(() => {
        if (Array.isArray(companies) && companies.length > 0) {
            setFilteredCompanies(companies.slice(0, 100));
        }
    }, [companies]);

    // Handler for contact info changes
    const handleContactInfoChange = (field: string, value: string) => {
        setContactInfo((prev: ContactInfo) => ({
            ...prev,
            [field]: value
        }));
        
        // Bileti de güncelle
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            [`contact_${field}`]: value
        }));
    };

    // Fetch contact info from API
    const fetchContactInfo = async (phoneNumber?: string, email?: string) => {
        if (!phoneNumber && !email) return;
        
        setLoadingContactInfo(true);
        try {
            const response = await fetch(`/api/main/contacts/getContactPhoneNumber`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber || "",
                    email: email || ""
                }),
            });
            
            if (!response.ok) {
                throw new Error('Kişi bilgileri alınamadı');
            }
            
            const data = await response.json();
            
            if (data && data.contact) {
                const contactData = {
                    name: data.contact.name || data.contact.firstName + " " + data.contact.lastName || "",
                    position: data.contact.position || "",
                    email: data.contact.email || email || "",
                    phone: data.contact.phone || phoneNumber || ""
                };
                
                setContactInfo(contactData);
                
                // Global objeye kaydet
                if (ticket?.id) {
                    ticketContactInfo[ticket.id] = contactData;
                }
                
                // Bileti güncelle
                setUpdatedTicket((prev: Ticket) => ({
                    ...prev,
                    contact_name: contactData.name,
                    contact_position: contactData.position,
                    contact_email: contactData.email,
                    contact_phone: contactData.phone
                }));
            }
        } catch (error) {
            console.error('Kişi bilgileri alınırken hata oluştu:', error);
        } finally {
            setLoadingContactInfo(false);
        }
    };

    // Handler for company change
    const handleCompanyChange = (companyId?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            company_id: companyId
        }));
    };

    // Handler for company search
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

    // Handler for assigned user change
    const handleAssignedToChange = (userId?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            assigned_to: userId
        }));
    };

    // Handler for category change
    const handleCategoryChange = (categoryId?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            category_id: categoryId,
            subcategory_id: undefined // Alt kategoriyi sıfırla
        }));
    };

    // Handler for subcategory change
    const handleSubcategoryChange = (subcategoryId?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            subcategory_id: subcategoryId
        }));
    };

    // Handler for group change
    const handleGroupChange = (groupId?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            group_id: groupId
        }));
    };

    // Handler for status change
    const handleStatusChange = (status?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            status: status || prev.status // Ensure status is never undefined
        }));
    };

    // Handler for priority change
    const handlePriorityChange = (priority?: string) => {
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            priority: priority || prev.priority // Ensure priority is never undefined
        }));
    };

    // Handler for adding a tag
    const handleAddTag = (tagName: string) => {
        // Yeni etiket ekle (geçici olarak id oluştur)
        const tempTag: Tag = {
            id: `temp-${Date.now()}`,
            name: tagName,
            isNew: true
        };

        setTags([...tags, tempTag]);
        
        // Bileti güncelle
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            tags: [...(prev.tags || []), tagName]
        }));
    };

    // Handler for removing a tag
    const handleRemoveTag = (tagId: string) => {
        const tagToRemove = tags.find(tag => tag.id === tagId);
        if (!tagToRemove) return;
        
        // Etiketi yerel state'den kaldır
        setTags(tags.filter(tag => tag.id !== tagId));
        
        // Bileti güncelle
        setUpdatedTicket((prev: Ticket) => ({
            ...prev,
            tags: (prev.tags || []).filter((tag: string) => tag !== tagToRemove.name)
        }));
    };

    // Helper function to handle tab navigation after resolving a ticket
    const removeResolvedClosedTickets = (tabName: string) => {
        // This would be implemented in the tab store
        console.log(`Removing resolved/closed tickets from tab: ${tabName}`);
    };

    // Handler for saving the ticket
    const handleSave = async () => {
        setIsSaving(true);
        setValidationError(null);

        try {
            // Zorunlu alanları kontrol et
            if (!updatedTicket.category_id || !updatedTicket.subcategory_id || !updatedTicket.company_id) {
                setValidationError("Lütfen Kategori, Alt Kategori ve Firma alanlarını doldurunuz.");
                return;
            }

            // Orijinal bileti sakla (audit log için)
            const originalTicket = { ...ticket };

            // Convert ticket tags to Tag objects for API compatibility
            const ticketForUpdate = {
                ...updatedTicket,
                tags: updatedTicket.tags ? updatedTicket.tags.map(tag => 
                    typeof tag === 'string' ? { id: `tag-${tag}`, name: tag } : tag
                ) : []
            };

            // Bileti güncelle
            const result = await TicketService.updateTicket(ticketForUpdate);

            // Başarılı olursa bileti güncelle
            onTicketUpdate({
                ...ticket,
                ...result
            });

            // Durum değişikliğini audit log'a kaydet
            if (originalTicket.status !== updatedTicket.status) {
                try {
                    await AuditService.logTicketStatusChange(
                        updatedTicket.id,
                        originalTicket.status,
                        updatedTicket.status,
                        {
                            status: originalTicket.status,
                            priority: originalTicket.priority,
                            assigned_to: originalTicket.assigned_to,
                            category_id: originalTicket.category_id,
                            subcategory_id: originalTicket.subcategory_id,
                            group_id: originalTicket.group_id
                        },
                        {
                            status: updatedTicket.status,
                            priority: updatedTicket.priority,
                            assigned_to: updatedTicket.assigned_to,
                            category_id: updatedTicket.category_id,
                            subcategory_id: updatedTicket.subcategory_id,
                            group_id: updatedTicket.group_id
                        }
                    );

                    // Durum geçmişi tablosuna kaydet
                    await StatusHistoryService.createStatusHistoryEntry(
                        updatedTicket.id,
                        originalTicket.status,
                        updatedTicket.status
                    );
                } catch (logError) {
                    console.error("Audit log oluşturulurken hata:", logError);
                    // Audit log hatası bileti güncellemeyi etkilemeyecek
                }
            }

            // Başarı mesajı göster
            toast({
                title: "Başarılı",
                description: "Bilet başarıyla güncellendi",
                variant: "default",
            });
        } catch (error: any) {
            console.error('Bilet güncellenirken hata oluştu:', error);
            setValidationError(error.message || "Bilet güncellenirken bir hata oluştu");
            
            toast({
                title: "Hata",
                description: error.message || "Bilet güncellenirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handler for resolve button click
    const handleResolveClick = () => {
        // Zorunlu alanları kontrol et
        if (!updatedTicket.category_id || !updatedTicket.subcategory_id || !updatedTicket.company_id) {
            setValidationError("Lütfen önce Kategori, Alt Kategori ve Firma seçimlerini yapınız.");
            return;
        }

        setValidationError(null);
        setIsResolveModalOpen(true);
    };

    // Handler for adding a resolution tag
    const handleAddResolutionTag = () => {
        if (!newTag.trim()) return;

        // Eğer bu etiket zaten varsa ekleme
        if (resolutionTags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
            toast({
                title: "Uyarı",
                description: "Bu etiket zaten eklenmiş",
                variant: "default",
            });
            return;
        }

        // Yeni etiket ekle (geçici olarak id oluştur)
        const tempTag = {
            id: `temp-${Date.now()}`,
            name: newTag.trim(),
            isNew: true // Yeni eklenen etiketleri işaretlemek için
        };

        setResolutionTags([...resolutionTags, tempTag]);
        setNewTag("");
    };

    // Handler for removing a resolution tag
    const handleRemoveResolutionTag = (tagToRemove: any) => {
        setResolutionTags(resolutionTags.filter(tag => tag.id !== tagToRemove.id));
    };

    // Handler for resolving the ticket
    const handleResolveTicket = async () => {
        if (!resolutionDetails.trim()) {
            toast({
                title: "Hata",
                description: "Lütfen çözüm detaylarını giriniz",
                variant: "destructive",
            });
            return;
        }

        setIsResolvingTicket(true);
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
            });

            // Başarılı olursa bileti güncelle
            onTicketUpdate({
                ...ticket,
                ...resolvedTicket,
                status: "resolved"
            });

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
            setIsResolveModalOpen(false);
            setResolutionDetails("");

            // Başarı mesajı göster
            toast({
                title: "Başarılı",
                description: "Bilet başarıyla çözümlendi olarak kapatıldı",
                variant: "default",
            });

            // Bilet güncellemesi tamamlandıktan sonra sekmeyi kapat ve bilet listesine dön
            const tabId = ticket.id ? `ticket-${ticket.id}` : `ticket-detail-${ticket.id}`;
            removeTab(tabId);
                    
            // Bilet durumuna göre uygun taba yönlendir
            // Eğer önceki aktif tab varsa, o taba dön
            if (previousActiveTab) {
                setActiveTab(previousActiveTab);
            } else {
                // Önceki tab yoksa, bilet durumuna göre yönlendir
                if (originalTicket.status === "resolved" || originalTicket.status === "closed") {
                    setActiveTab('Çözülen Talepler');
                } else if (originalTicket.status === "pending" || originalTicket.status === "waiting") {
                    setActiveTab('Bekleyen Talepler');
                } else {
                    setActiveTab('Tüm Talepler');
                }
            }
        } catch (error: any) {
            console.error('Bilet çözümlenirken hata oluştu:', error);
            toast({
                title: "Hata",
                description: error.message || "Bilet çözümlenirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setIsResolvingTicket(false);
        }
    };

    // Check if ticket has changes
    const hasChanges = useMemo(() => {
        return JSON.stringify(ticket) !== JSON.stringify(updatedTicket);
    }, [ticket, updatedTicket]);

    // Bilet yüklenmemişse
    if (!ticket) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Render the component
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
                {validationError && (
                    <div className="mb-4 p-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                        {validationError}
                    </div>
                )}

                {/* Company Selector */}
                <CompanySelector 
                    companies={companies}
                    filteredCompanies={filteredCompanies}
                    companySearch={companySearch}
                    selectedCompanyId={updatedTicket.company_id}
                    handleCompanyChange={handleCompanyChange}
                    handleCompanyInputChange={handleCompanyInputChange}
                    isLoading={loadingCompanies}
                    selectClassNames={selectClassNames}
                    selectStyles={selectStyles}
                    selectTheme={selectTheme}
                    menuPortalTarget={menuPortalTarget}
                    isDisabled={isSaving || isResolvingTicket}
                />

                {/* Contact Information */}
                <ContactInformation 
                    contactInfo={contactInfo}
                    isEditingContact={isEditingContact}
                    setIsEditingContact={setIsEditingContact}
                    handleContactInfoChange={handleContactInfoChange}
                    loadingContactInfo={loadingContactInfo}
                    isDisabled={isSaving || isResolvingTicket}
                />

                {/* Assigned User Selector */}
                <AssignedUserSelector 
                    users={users}
                    selectedUserId={updatedTicket.assigned_to}
                    handleAssignedToChange={handleAssignedToChange}
                    refetchUsers={refetchUsers}
                    isLoading={loadingUsers}
                    selectClassNames={selectClassNames}
                    selectStyles={selectStyles}
                    selectTheme={selectTheme}
                    menuPortalTarget={menuPortalTarget}
                    isDisabled={isSaving || isResolvingTicket}
                />

                {/* Ticket Status Section */}
                <TicketStatusSection 
                    status={updatedTicket.status}
                    priority={updatedTicket.priority}
                    handleStatusChange={handleStatusChange}
                    handlePriorityChange={handlePriorityChange}
                    selectClassNames={selectClassNames}
                    selectStyles={selectStyles}
                    selectTheme={selectTheme}
                    menuPortalTarget={menuPortalTarget}
                    isDisabled={isSaving || isResolvingTicket}
                />

                {/* Ticket Category Selector */}
                <TicketCategorySelector 
                    selectedCategoryId={updatedTicket.category_id}
                    selectedSubcategoryId={updatedTicket.subcategory_id}
                    selectedGroupId={updatedTicket.group_id}
                    categories={categories ? categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        subcategories: (cat.subcategories || []).map(sub => ({
                            id: sub.id,
                            name: sub.name,
                            category_id: cat.id
                        }))
                    })) : []}
                    groups={Array.isArray(groups) ? groups.map(group => ({
                        id: group.id,
                        name: group.name
                    })) : []}
                    handleCategoryChange={handleCategoryChange}
                    handleSubcategoryChange={handleSubcategoryChange}
                    handleGroupChange={handleGroupChange}
                    selectClassNames={selectClassNames}
                    selectStyles={selectStyles}
                    selectTheme={selectTheme}
                    menuPortalTarget={menuPortalTarget}
                    isDisabled={isSaving || isResolvingTicket}
                    isLoading={loadingCategories}
                />

                {/* Ticket Tags Section */}
                <TicketTagsSection 
                    tags={updatedTicket.tags?.map(tag => 
                        typeof tag === 'string' ? { id: tag, name: tag } : tag
                    ) || []}
                    handleAddTag={handleAddTag}
                    handleRemoveTag={handleRemoveTag}
                />

                {/* Ticket Dates Info */}
                <TicketDatesInfo 
                    createdAt={updatedTicket.created_at}
                    updatedAt={updatedTicket.updated_at}
                    dueDate={updatedTicket.due_date}
                />
            </ScrollArea>

            {/* Ticket Actions */}
            <div className="p-4 border-t">
                <TicketActions 
                    isSaving={isSaving}
                    isResolvingTicket={isResolvingTicket}
                    hasChanges={hasChanges}
                    handleSave={handleSave}
                    handleResolveClick={handleResolveClick}
                    isDisabled={!hasChanges || isSaving || isResolvingTicket}
                />
            </div>

            {/* Resolve Ticket Modal */}
            <ResolveTicketModal 
                isOpen={isResolveModalOpen}
                setIsOpen={setIsResolveModalOpen}
                resolutionDetails={resolutionDetails}
                setResolutionDetails={setResolutionDetails}
                resolutionTags={resolutionTags}
                newTag={newTag}
                setNewTag={setNewTag}
                handleAddResolutionTag={handleAddResolutionTag}
                handleRemoveResolutionTag={handleRemoveResolutionTag}
                handleResolveTicket={handleResolveTicket}
                isResolvingTicket={isResolvingTicket}
            />
        </Card>
    );
};

export default TicketSidebar;
