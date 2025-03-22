"use client"

import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Phone, AlertCircle, MapPin, User, Briefcase, UserRound, Building2 } from "lucide-react"
import { useTabStore } from "@/stores/tab-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Contact, useContactsStore } from "@/stores/main/contacts-store"
import { useCompanies } from "@/providers/companies-provider"
import axios from "@/lib/axios"

interface ContactListProps {
    contacts: Contact[]
    isLoading: boolean
    error: string | null
    onContactDeleted: (contactId: string) => void
}

export function ContactList({ contacts, isLoading, error, onContactDeleted }: ContactListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const { deleteContact } = useContactsStore()
    const { companies } = useCompanies()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    // Firma adını bulmak için yardımcı fonksiyon
    const getCompanyName = (companyId: string | undefined) => {
        if (!companyId) return "-";
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : "-";
    };

    const handleViewContact = (contact: Contact) => {
        const tabId = `contact-${contact.id}`
        addTab({
            id: tabId,
            title: `${contact.firstName} ${contact.lastName}`,
            lazyComponent: () => import('@/app/[tenantId]/(main)/contacts/crud-components/CreateContact').then(module => ({
                default: (props: any) => <module.default {...props} contactId={contact.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleEditContact = (contact: Contact) => {
        const tabId = `edit-contact-${contact.id}`
        addTab({
            id: tabId,
            title: `${contact.firstName} ${contact.lastName} (Düzenle)`,
            lazyComponent: () => import('@/app/[tenantId]/(main)/contacts/crud-components/CreateContact').then(module => ({
                default: (props: any) => <module.default {...props} contactId={contact.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!contactToDelete) return
        
        setIsDeleting(true)
        try {
            // API üzerinden silme işlemi
            await axios.delete(`/api/main/contacts/delete/${contactToDelete.id}`)
            
            // Store'dan silme işlemi
            deleteContact(contactToDelete.id)
            
            toast({
                title: "Başarılı",
                description: "Kişi başarıyla silindi",
                variant: "default",
            })
            setIsDeleteDialogOpen(false)
            
            // Yeniden yükleme için callback çağır
            onContactDeleted(contactToDelete.id)
        } catch (error: any) {
            console.error("Kişi silinirken hata:", error)
            toast({
                title: "Hata",
                description: error.message || "Kişi silinirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <CustomLoader 
                    message="Yükleniyor" 
                    description="Kişi verileri hazırlanıyor..." 
                />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (contacts.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <UserRound className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz kişi bulunmuyor</h3>
                <p className="text-muted-foreground mt-2">
                    Yeni kişi eklemek için "Yeni Kişi" butonuna tıklayın.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-transparent
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
            <Table className="relative w-full">
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                    <UserRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </span>
                                Ad Soyad
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                </span>
                                Firma
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Pozisyon
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </span>
                                E-posta
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </span>
                                Telefon
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </span>
                                Şehir
                            </div>
                        </TableHead>
                        <TableHead className="w-[5%] text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                                    <Eye className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                </span>
                                İşlemler
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.map((contact) => (
                        <TableRow 
                            key={contact.id}
                            className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                            <TableCell>
                                <div className="font-medium flex items-center">
                                    <User className="h-4 w-4 mr-2 text-indigo-600" />
                                    {contact.firstName} {contact.lastName}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2 text-teal-600" />
                                    {getCompanyName(contact.companyId)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                                    {contact.position || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                    {contact.email || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                    {contact.mobile || contact.phone || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                    {contact.city || "-"}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                            <Edit className="h-4 w-4 mr-2 text-blue-600" /> Düzenle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => handleDeleteClick(contact)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 text-red-600" /> Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    
                    {contacts.length > 0 && (
                        <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                            <TableCell colSpan={6} className="text-right">
                                <div className="font-bold">TOPLAM: {contacts.length} kişi</div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kişiyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Bu kişi ve ilişkili tüm veriler kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
