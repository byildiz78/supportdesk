"use client"

import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, Building, Mail, Phone, Hash, Building2, AlertCircle, MapPin, User } from "lucide-react"
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
import { useParentCompaniesStore } from "@/stores/main/parent-companies-store"
import axios from "@/lib/axios"

// Temporarily define ParentCompany type here until the API file is fixed
type ParentCompany = {
    id: string;
    uuid: string;
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    companyType?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    createdBy?: string;
    updatedAt: Date;
    updatedBy?: string;
    isDeleted: boolean;
};

interface ParentCompanyListProps {
    companies: ParentCompany[]
    isLoading: boolean
    error: string | null
    onCompanyDeleted: (companyId: string) => void
}

export function ParentCompanyList({ companies, isLoading, error, onCompanyDeleted }: ParentCompanyListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const { deleteParentCompany } = useParentCompaniesStore()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [companyToDelete, setCompanyToDelete] = useState<ParentCompany | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    const handleViewCompany = (company: ParentCompany) => {
        const tabId = `company-${company.id}`
        addTab({
            id: tabId,
            title: company.name,
            lazyComponent: () => import('@/app/[tenantId]/(main)/parent-companies/crud-components/CreateParentCompany').then(module => ({
                default: (props: any) => <module.default {...props} companyId={company.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleEditCompany = (company: ParentCompany) => {
        const tabId = `edit-company-${company.id}`
        addTab({
            id: tabId,
            title: `${company.name} (Düzenle)`,
            lazyComponent: () => import('@/app/[tenantId]/(main)/parent-companies/crud-components/CreateParentCompany').then(module => ({
                default: (props: any) => <module.default {...props} companyId={company.id} />
            }))
        })
        setActiveTab(tabId)
    }


    const handleDeleteClick = (company: ParentCompany) => {
        setCompanyToDelete(company)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!companyToDelete) return
        
        setIsDeleting(true)
        try {
            // API üzerinden silme işlemi
            await axios.delete(`/api/main/parent-companies/delete/${companyToDelete.id}`)
            
            // Store'dan silme işlemi
            deleteParentCompany(parseInt(companyToDelete.id))
            
            toast({
                title: "Başarılı",
                description: "Ana firma başarıyla silindi",
                variant: "default",
            })
            setIsDeleteDialogOpen(false)
            
            // Yeniden yükleme için callback çağır
            onCompanyDeleted(companyToDelete.id)
        } catch (error: any) {
            console.error("Ana firma silinirken hata:", error)
            toast({
                title: "Hata",
                description: error.message || "Ana firma silinirken bir hata oluştu",
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
                    description="Ana firma verileri hazırlanıyor..." 
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

    if (companies.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz ana firma bulunmuyor</h3>
                <p className="text-muted-foreground mt-2">
                    Yeni ana firma eklemek için "Yeni Ana Firma" butonuna tıklayın.
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
                        <TableHead className="w-[30%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </span>
                                Firma Adı
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Vergi No
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
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
                    {companies.map((company) => (
                        <TableRow 
                            key={company.id}
                            className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                            <TableCell>
                                <div className="font-medium flex items-center">
                                    <Building className="h-4 w-4 mr-2 text-indigo-600" />
                                    {company.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Hash className="h-4 w-4 mr-2 text-gray-500" />
                                    {company.taxId || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                    {company.email || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                    {company.phone || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                    {company.city || "-"}
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
                                        <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                            <Eye className="h-4 w-4 mr-2 text-indigo-600" /> Görüntüle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                            <Edit className="h-4 w-4 mr-2 text-blue-600" /> Düzenle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => handleDeleteClick(company)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 text-red-600" /> Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    
                    {companies.length > 0 && (
                        <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold">
                            <TableCell colSpan={6} className="text-right">
                                <div className="font-bold">TOPLAM: {companies.length} ana firma</div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ana firmayı silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Bu ana firma ve ilişkili tüm veriler kalıcı olarak silinecektir.
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
