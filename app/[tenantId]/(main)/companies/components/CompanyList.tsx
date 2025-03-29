"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, Building, Mail, Phone, Hash, Building2, AlertCircle, Calendar, FileText } from "lucide-react"
import { Company, useCompaniesStore } from "@/stores/main/companies-store"
import { useTabStore } from "@/stores/tab-store"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import axios from "@/lib/axios"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/formatters"
import { useToast } from "@/hooks/use-toast"

interface CompanyListProps {
    companies: Company[]
    isLoading: boolean
    error: string | null
    onCompanyDeleted: () => void
}

export function CompanyList({ companies, isLoading, error, onCompanyDeleted }: CompanyListProps) {
    const { addTab, setActiveTab, tabs, activeTab } = useTabStore()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()
    const { deleteCompany } = useCompaniesStore()

    const handleViewCompany = (company: Company) => {
        const tabId = `company-${company.id}`
        addTab({
            id: tabId,
            title: company.name,
            lazyComponent: () => import('@/app/[tenantId]/(main)/companies/crud-components/CreateCompany').then(module => ({
                default: (props: any) => <module.default {...props} companyId={company.id} />
            }))
        })
        setActiveTab(tabId)
    }

    const handleEditCompany = (company: Company) => {
        const tabId = `edit-company-${company.id}`
        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId)
        if (!isTabAlreadyOpen) {
            addTab({
                id: tabId,
                title: `${company.name} (Düzenle)`,
                lazyComponent: () => import('@/app/[tenantId]/(main)/companies/crud-components/CreateCompany').then(module => ({
                    default: (props: any) => <module.default {...props} companyId={company.id} />
                }))
            })
        }
        setActiveTab(tabId)
    }

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!companyToDelete) return

        try {
            setIsDeleting(true)
            await axios.post('/api/main/companies/deleteCompany', {
                id: companyToDelete.id
            })
            deleteCompany(companyToDelete.id)
            toast({
                title: "Başarılı",
                description: "Şirket başarıyla silindi",
                variant: "default",
            })

        } catch (error: any) {
            console.error('Şirket silinirken hata:', error)
            toast({
                title: "Hata",
                description: error.message || "Şirket silinirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setCompanyToDelete(null)
        }
    }

    // Helper function to truncate text
    const truncateText = (text: string | undefined, maxLength: number = 30) => {
        if (!text) return "-";
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

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
                <TooltipProvider>
                <Table>
                    <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <TableRow>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </span>
                                    Firma Adı
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </span>
                                    Ana Firma
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </span>
                                    E-posta
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    </span>
                                    Telefon
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                        <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </span>
                                    Vergi No
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    </span>
                                    Başlangıç Tarihi
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                    </span>
                                    Bitiş Tarihi
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                    </span>
                                    BA Notları
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%]">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                    </span>
                                    Lisans Notları
                                </div>
                            </TableHead>
                            <TableHead className="w-[5%] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-[400px]">
                                    <CustomLoader
                                        message="Yükleniyor"
                                        description="Firma verileri hazırlanıyor..."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : companies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-[400px] text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Building className="h-8 w-8 text-gray-400" />
                                        <h3 className="font-semibold text-lg">Firma Bulunamadı</h3>
                                        <p className="text-muted-foreground">Henüz hiç firma kaydı oluşturulmamış veya arama kriterlerine uygun firma bulunamadı.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            companies.map((company) => (
                                <TableRow key={company.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell>{company.parentCompanyId || "-"}</TableCell>
                                    <TableCell>{company.email || "-"}</TableCell>
                                    <TableCell>{company.phone || "-"}</TableCell>
                                    <TableCell>{company.taxId || "-"}</TableCell>
                                    <TableCell>{formatDate(company.flow_ba_starting_date) || "-"}</TableCell>
                                    <TableCell>{formatDate(company.flow_ba_end_date) || "-"}</TableCell>
                                    <TableCell>
                                        {company.flow_ba_notes ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help underline decoration-dotted">
                                                        {truncateText(company.flow_ba_notes, 20)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-sm bg-secondary text-secondary-foreground">
                                                    <p className="text-sm">{company.flow_ba_notes}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {company.flow_licence_notes ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help underline decoration-dotted">
                                                        {truncateText(company.flow_licence_notes, 20)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-sm bg-secondary text-secondary-foreground">
                                                    <p className="text-sm">{company.flow_licence_notes}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditCompany(company)}>
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
                </TooltipProvider>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Şirket Silme İşlemi</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold">{companyToDelete?.name}</span> isimli şirketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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