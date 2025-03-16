"use client"

import { Card } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Building2, Calendar, AlertCircle, Loader2, Save } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TicketService, CompanyService, ContactService } from "../services/ticket-service"
import { UserService } from "../../../users/services/user-service"

interface TicketSidebarProps {
    ticket: any;
    onTicketUpdate: (updatedTicket: any) => void;
}

export function TicketSidebar({ ticket, onTicketUpdate }: TicketSidebarProps) {
    const [companies, setCompanies] = useState<any[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loadingCompanies, setLoadingCompanies] = useState(false)
    const [loadingContacts, setLoadingContacts] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [updatedTicket, setUpdatedTicket] = useState<any>(ticket || {})
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    // Bilet değiştiğinde updatedTicket'ı güncelle
    useEffect(() => {
        if (ticket) {
            setUpdatedTicket(ticket)
        }
    }, [ticket])

    // Firmaları getir
    const fetchCompanies = async () => {
        setLoadingCompanies(true)
        try {
            const companiesData = await CompanyService.getCompanies()
            setCompanies(companiesData || [])
        } catch (error: any) {
            console.error('Firmalar alınırken hata oluştu:', error)
            toast({
                title: "Hata",
                description: "Firmalar alınırken bir hata oluştu",
                variant: "destructive",
            })
            setCompanies([])
        } finally {
            setLoadingCompanies(false)
        }
    }

    // Tüm kişileri getir
    const fetchAllContacts = async () => {
        setLoadingContacts(true)
        try {
            // ContactService üzerinden tüm kişileri getir
            const contactsData = await ContactService.getAllContacts()
            setContacts(contactsData || [])
        } catch (error: any) {
            console.error('Kişiler alınırken hata oluştu:', error)
            toast({
                title: "Hata",
                description: "Kişiler alınırken bir hata oluştu",
                variant: "destructive",
            })
            setContacts([])
        } finally {
            setLoadingContacts(false)
        }
    }

    // Kullanıcıları getir
    const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
            const usersData = await UserService.getUsers()
            setUsers(usersData || [])
        } catch (error: any) {
            console.error('Kullanıcılar alınırken hata oluştu:', error)
            toast({
                title: "Hata",
                description: "Kullanıcılar alınırken bir hata oluştu",
                variant: "destructive",
            })
            setUsers([])
        } finally {
            setLoadingUsers(false)
        }
    }

    // Sayfa yüklendiğinde firmaları ve kişileri getir
    useEffect(() => {
        fetchCompanies()
        fetchAllContacts()
        fetchUsers()
    }, [])

    // Durum değiştiğinde
    const handleStatusChange = (value: string) => {
        setUpdatedTicket((prev: any) => ({
            ...prev,
            status: value
        }))
    }

    // Öncelik değiştiğinde
    const handlePriorityChange = (value: string) => {
        setUpdatedTicket((prev: any) => ({
            ...prev,
            priority: value
        }))
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
            setUpdatedTicket((prev: any) => ({
                ...prev,
                company_id: null,
                company_name: null
            }))
            return
        }

        const selectedCompany = companies.find(company => company.id === value)
        if (selectedCompany) {
            setUpdatedTicket((prev: any) => ({
                ...prev,
                company_id: value,
                company_name: selectedCompany.name || "İsimsiz Firma"
            }))
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
            // Contact nesnesinde name özelliği olmayabilir, bu durumda first_name ve last_name kullan
            const contactName = selectedContact.name || 
                              `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() || 
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

    // Değişiklikleri kaydet
    const handleSave = async () => {
        if (!updatedTicket || !updatedTicket.id) {
            toast({
                title: "Hata",
                description: "Bilet bilgileri eksik",
                variant: "destructive",
            })
            return
        }
        
        setIsSaving(true)
        try {
            // TicketService üzerinden güncelleme yap
            const updatedTicketData = await TicketService.updateTicket({
                ...updatedTicket,
                id: updatedTicket.id
            })
            
            // Başarılı olursa bileti güncelle
            onTicketUpdate(updatedTicketData)
            toast({
                title: "Başarılı",
                description: "Bilet başarıyla güncellendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Bilet güncellenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Bilet güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    // Combobox için firma seçeneklerini hazırla - daha güvenli bir şekilde
    const companyOptions = React.useMemo(() => {
        console.log("Creating company options from:", companies);
        console.log("Companies type:", typeof companies);
        console.log("Is companies an array:", Array.isArray(companies));
        
        if (!Array.isArray(companies)) {
            console.log("Companies is not an array, returning empty array");
            return [];
        }
        
        const options = companies.map(company => {
            console.log("Processing company:", company);
            return {
                value: company.id || "",
                label: company.name || "İsimsiz Firma"
            };
        });
        
        console.log("Final company options:", options);
        return options;
    }, [companies]);

    // Combobox için kişi seçeneklerini hazırla - daha güvenli bir şekilde
    const contactOptions = React.useMemo(() => {
        console.log("Creating contact options from:", contacts);
        console.log("Contacts type:", typeof contacts);
        console.log("Is contacts an array:", Array.isArray(contacts));
        
        if (!Array.isArray(contacts)) {
            console.log("Contacts is not an array, returning empty array");
            return [];
        }
        
        const options = contacts.map(contact => {
            console.log("Processing contact:", contact);
            
            // Contact nesnesinde name özelliği olmayabilir, bu durumda first_name ve last_name kullan
            const firstName = contact.first_name || '';
            const lastName = contact.last_name || '';
            console.log("Contact first_name:", firstName, "last_name:", lastName);
            
            const contactName = contact.name || 
                               `${firstName} ${lastName}`.trim() || 
                               "İsimsiz Kişi";
            
            console.log("Final contact name:", contactName);
            
            return {
                value: contact.id || "",
                label: contactName
            };
        });
        
        console.log("Final contact options:", options);
        return options;
    }, [contacts]);

    // Combobox için durum seçenekleri
    const statusOptions = [
        { value: "open", label: "Açık" },
        { value: "in_progress", label: "İşlemde" },
        { value: "pending", label: "Beklemede" },
        { value: "resolved", label: "Çözüldü" },
        { value: "closed", label: "Kapalı" }
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
        console.log("Creating assignedTo options from:", users);
        
        if (!Array.isArray(users)) {
            console.log("Users is not an array, returning empty array");
            return [];
        }
        
        const options = users.map(user => {
            return {
                value: user.id || "",
                label: user.name || "İsimsiz Kullanıcı"
            };
        });
        
        console.log("Final assignedTo options:", options);
        return options;
    }, [users]);

    // Bilet yüklenmemişse
    if (!ticket) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <Card className="flex-1 overflow-hidden">
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-4">Durum</h3>
                            <Combobox
                                options={statusOptions}
                                value={updatedTicket?.status || ""}
                                onChange={handleStatusChange}
                                placeholder="Seçiniz"
                                searchPlaceholder="Durum ara..."
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Öncelik</h3>
                            <Combobox
                                options={priorityOptions}
                                value={updatedTicket?.priority || ""}
                                onChange={handlePriorityChange}
                                placeholder="Seçiniz"
                                searchPlaceholder="Öncelik ara..."
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Atanan Kişi</h3>
                            {loadingUsers ? (
                                <div className="flex items-center space-x-2 p-2 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <span className="text-sm text-gray-500">Kullanıcılar yükleniyor...</span>
                                </div>
                            ) : (
                                <>
                                    <Combobox
                                        options={assignedToOptions}
                                        value={updatedTicket?.assigned_to || ""}
                                        onChange={handleAssignedToChange}
                                        placeholder="Seçiniz"
                                        searchPlaceholder="Kullanıcı ara..."
                                    />
                                    {updatedTicket?.assigned_to && updatedTicket?.assigned_user_name && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            <span>Atanan: </span>
                                            <span className="font-medium">{updatedTicket.assigned_user_name}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Firma</h3>
                            <Combobox
                                options={companyOptions}
                                value={updatedTicket?.company_id || ""}
                                onChange={handleCompanyChange}
                                placeholder="Seçiniz"
                                searchPlaceholder="Firma ara..."
                                disabled={loadingCompanies}
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">İletişim Kişisi</h3>
                            <Combobox
                                options={contactOptions}
                                value={updatedTicket?.contact_id || ""}
                                onChange={handleContactChange}
                                placeholder="Seçiniz"
                                searchPlaceholder="Kişi ara..."
                                disabled={loadingContacts}
                            />
                        </div>

                        {updatedTicket?.customer_name && (
                            <div className="space-y-4">
                                <h3 className="font-semibold">Müşteri Bilgileri</h3>
                                <div className="space-y-2">
                                    {updatedTicket.customer_name && (
                                        <div className="flex items-center text-sm">
                                            <User className="h-4 w-4 mr-2 text-gray-500" />
                                            <span>{updatedTicket.customer_name}</span>
                                        </div>
                                    )}
                                    {updatedTicket.customer_email && (
                                        <div className="flex items-center text-sm">
                                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                            <span>{updatedTicket.customer_email}</span>
                                        </div>
                                    )}
                                    {updatedTicket.customer_phone && (
                                        <div className="flex items-center text-sm">
                                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                            <span>{updatedTicket.customer_phone}</span>
                                        </div>
                                    )}
                                    {updatedTicket.contact_position && (
                                        <div className="flex items-center text-sm">
                                            <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                                            <span>{updatedTicket.contact_position}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-semibold">Tarih Bilgileri</h3>
                            <div className="space-y-2">
                                {ticket.created_at && (
                                    <div className="flex items-center text-sm">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                        <span>Oluşturulma: {format(new Date(ticket.created_at), 'PPP', { locale: tr })}</span>
                                    </div>
                                )}
                                {ticket.updated_at && (
                                    <div className="flex items-center text-sm">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                        <span>Güncelleme: {format(new Date(ticket.updated_at), 'PPP', { locale: tr })}</span>
                                    </div>
                                )}
                                {ticket.due_date && (
                                    <div className="flex items-center text-sm">
                                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                        <span>Son Tarih: {format(new Date(ticket.due_date), 'PPP', { locale: tr })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </Card>
            
            <div className="sticky bottom-0 p-4 bg-background border-t shadow-md">
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
        </div>
    )
}
