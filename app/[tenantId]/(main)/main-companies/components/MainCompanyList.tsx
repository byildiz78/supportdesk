"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomLoader } from "@/components/ui/custom-loader"
import { MoreHorizontal, Eye, Edit, Trash2, Building2, Mail, Phone, Hash } from "lucide-react"
import { MainCompany } from "@/types/customers"
import { useTabStore } from "@/stores/tab-store"

interface MainCompanyListProps {
    companies: MainCompany[]
    isLoading: boolean
}

export function MainCompanyList({ companies, isLoading }: MainCompanyListProps) {
    const { addTab, setActiveTab } = useTabStore()

    const handleViewCompany = (company: MainCompany) => {
        const tabId = `main-company-${company.id}`
        addTab({
            id: tabId,
            title: company.name,
            lazyComponent: () => import('../detail/page').then(module => ({
                default: (props: any) => <module.default {...props} companyId={company.id} />
            }))
        })
        setActiveTab(tabId)
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
            <Table>
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <TableRow>
                        <TableHead className="w-[25%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </span>
                                Ana Firma Adı
                            </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </span>
                                E-posta
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </span>
                                Telefon
                            </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </span>
                                Flow ID
                            </div>
                        </TableHead>
                        <TableHead className="w-[5%] text-right">İşlemler</TableHead>
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
                                            <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                                <Eye className="h-4 w-4 mr-2" /> Görüntüle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2" /> Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
    )
}