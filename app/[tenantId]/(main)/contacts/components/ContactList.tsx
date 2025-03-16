"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, User, Mail, Phone, Briefcase, Building, AlertCircle } from "lucide-react"
import { Contact } from "@/stores/main/contacts-store"
import { useTabStore } from "@/stores/tab-store"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import axios from "@/lib/axios"
import { toast } from "@/components/ui/toast/use-toast"
import { useCompaniesStore } from "@/stores/main/companies-store"

interface ContactListProps {
    contacts: Contact[]
    isLoading: boolean
    error: string | null
    onContactDeleted: () => void
}

export function ContactList({ contacts, isLoading, error, onContactDeleted }: ContactListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const { companies } = useCompaniesStore()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Get company name by ID
    const getCompanyName = (companyId: string | undefined) => {
        if (!companyId) return "-"
        const company = companies.find(c => c.id === companyId)
        return company ? company.name : "-"
    }

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
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!contactToDelete) return

        try {
            setIsDeleting(true)
            await axios.post('/api/main/contacts/deleteContact', {
                id: contactToDelete.id
            })
            toast.success('Kişi başarıyla silindi')
            onContactDeleted()
        } catch (error) {
            console.error('Kişi silinirken hata:', error)
            toast.error('Kişi silinemedi')
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setContactToDelete(null)
        }
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Hata Oluştu</h3>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex-1 overflow-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
                <Table>
                    <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <TableRow>
                            <TableHead className="w-[20%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </span>
                                    Ad Soyad
                                </div>
                            </TableHead>
                            <TableHead className="w-[20%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                        <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </span>
                                    Firma
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                        <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </span>
                                    Pozisyon
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    </span>
                                    E-posta
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </span>
                                    Telefon
                                </div>
                            </TableHead>
                            <TableHead className="w-[5%] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[400px]">
                                    <CustomLoader
                                        message="Yükleniyor"
                                        description="Kişi verileri hazırlanıyor..."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[400px] text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <User className="h-8 w-8 text-gray-400" />
                                        <h3 className="font-semibold text-lg">Kişi Bulunamadı</h3>
                                        <p className="text-muted-foreground">Henüz hiç kişi kaydı oluşturulmamış veya arama kriterlerine uygun kişi bulunamadı.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact) => (
                                <TableRow key={contact.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <TableCell className="font-medium">
                                        {contact.firstName} {contact.lastName}
                                        {contact.isPrimary && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                Birincil
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getCompanyName(contact.companyId)}</TableCell>
                                    <TableCell>{contact.position || "-"}</TableCell>
                                    <TableCell>{contact.email || "-"}</TableCell>
                                    <TableCell>{contact.phone || contact.mobile || "-"}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                                                    <Eye className="h-4 w-4 mr-2" /> Görüntüle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600 dark:text-red-400"
                                                    onClick={() => handleDeleteClick(contact)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kişi Silme İşlemi</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold">{contactToDelete?.firstName} {contactToDelete?.lastName}</span> isimli kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteConfirm} 
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
