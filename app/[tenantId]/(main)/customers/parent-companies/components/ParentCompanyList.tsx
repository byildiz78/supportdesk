"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, Building, Mail, Phone, Hash, Building2, AlertCircle } from "lucide-react"
import { MainCompany } from "@/types/customers"
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
import { useParentCompanies } from "@/hooks/use-parent-companies"

interface ParentCompanyListProps {
    companies: MainCompany[]
    isLoading: boolean
    error: string | null
    onCompanyDeleted?: () => void
}

export function ParentCompanyList({ companies, isLoading, error, onCompanyDeleted }: ParentCompanyListProps) {
    const { addTab, setActiveTab } = useTabStore()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [companyToDelete, setCompanyToDelete] = useState<MainCompany | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()
    const { deleteParentCompanyById } = useParentCompanies({ initialLoad: false })

    const handleViewParentCompany = (company: MainCompany) => {
        const tabId = `parent-company-${company.id}`
        addTab({
            id: tabId,
            title: company.name,
            lazyComponent: () => import('../detail/page').then(module => ({
                default: (props: any) => <module.default {...props} parentCompanyId={company.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleEditParentCompany = (company: MainCompany) => {
        const tabId = `edit-parent-company-${company.id}`
        addTab({
            id: tabId,
            title: `${company.name} - Düzenle`,
            lazyComponent: () => import('../edit/page').then(module => ({
                default: (props: any) => <module.default {...props} parentCompanyId={company.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleDeleteClick = (company: MainCompany) => {
        setCompanyToDelete(company)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!companyToDelete) return
        
        setIsDeleting(true)
        try {
            await deleteParentCompanyById(companyToDelete.id)
            toast({
                title: "Başarılı",
                description: "Ana firma başarıyla silindi",
                variant: "default",
            })
            setIsDeleteDialogOpen(false)
            // Yeniden yükleme için callback çağır
            if (onCompanyDeleted) {
                onCompanyDeleted()
            }
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

    return (
        <div className="flex-1 overflow-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-transparent
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Table>
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <TableRow>
                        <TableHead className="w-[25%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </span>
                                Ana Firma Adı
                            </div>
                        </TableHead>
                        <TableHead className="w-[25%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </span>
                                E-posta
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                </span>
                                Telefon
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </span>
                                Flow ID
                            </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-[400px]">
                                <CustomLoader
                                    message="Yükleniyor"
                                    description="Ana firma verileri hazırlanıyor..."
                                />
                            </TableCell>
                        </TableRow>
                    ) : companies.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Building2 className="h-8 w-8 text-gray-400" />
                                    <h3 className="font-semibold text-lg">Ana Firma Bulunamadı</h3>
                                    <p className="text-muted-foreground">Henüz hiç ana firma kaydı oluşturulmamış.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        companies.map((company) => (
                            <TableRow key={company.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.email}</TableCell>
                                <TableCell>{company.phone}</TableCell>
                                <TableCell>{company.flowId}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleViewParentCompany(company)}>
                                                <Eye className="h-4 w-4 mr-2" /> Görüntüle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditParentCompany(company)}>
                                                <Edit className="h-4 w-4 mr-2" /> Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600 dark:text-red-400"
                                                onClick={() => handleDeleteClick(company)}
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

            {/* Silme onay dialogu */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ana Firmayı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">{companyToDelete?.name}</span> isimli ana firmayı silmek istediğinize emin misiniz?
                            <br /><br />
                            Bu işlem geri alınamaz ve ana firmaya bağlı tüm veriler etkilenebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
