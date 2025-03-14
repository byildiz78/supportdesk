"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTabStore } from "@/stores/tab-store"
import { Building2, Mail, Phone, MapPin, Hash, Edit, Calendar, User, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useParentCompanies } from "@/hooks/use-parent-companies"
import { MainCompany } from "@/types/customers"
import { useCustomersStore } from "@/stores/customers-store"

interface ParentCompanyDetailPageProps {
    parentCompanyId: string;
}

export default function ParentCompanyDetailPage({ parentCompanyId }: ParentCompanyDetailPageProps) {
    const { addTab, setActiveTab: setActiveTabInStore } = useTabStore()
    const { companies } = useCustomersStore()
    const [activeTab, setActiveTab] = useState("overview")
    const [parentCompany, setParentCompany] = useState<MainCompany | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    const { fetchParentCompany } = useParentCompanies({ initialLoad: false })

    useEffect(() => {
        const loadParentCompany = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const company = await fetchParentCompany(parentCompanyId)
                setParentCompany(company)
            } catch (err: any) {
                console.error("Ana şirket yüklenirken hata:", err)
                setError(err.message || "Ana şirket yüklenirken bir hata oluştu")
            } finally {
                setIsLoading(false)
            }
        }
        
        loadParentCompany()
    }, [parentCompanyId, fetchParentCompany])

    // Find all companies belonging to this parent company
    const relatedCompanies = companies.filter(c => c.mainCompanyId === parentCompanyId)

    // Ana şirket düzenleme sayfasına yönlendir
    const handleEditCompany = () => {
        if (!parentCompany) return
        
        const tabId = `edit-parent-company-${parentCompanyId}`
        addTab({
            id: tabId,
            title: `${parentCompany.name} - Düzenle`,
            lazyComponent: () => import('../edit/page').then(module => ({
                default: (props: any) => <module.default {...props} parentCompanyId={parentCompanyId} />
            }))
        })
        setActiveTabInStore(tabId)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-muted-foreground">Ana şirket yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center gap-2 max-w-md text-center">
                    <Building2 className="h-10 w-10 text-red-500" />
                    <h2 className="text-xl font-bold">Bir hata oluştu</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                        className="mt-4"
                    >
                        Yeniden Dene
                    </Button>
                </div>
            </div>
        )
    }

    if (!parentCompany) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center gap-2 max-w-md text-center">
                    <Building2 className="h-10 w-10 text-gray-400" />
                    <h2 className="text-xl font-bold">Ana şirket bulunamadı</h2>
                    <p className="text-muted-foreground">İstediğiniz ana şirket kaydı bulunamadı veya silinmiş olabilir.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
            {/* Header */}
            <Card className="p-6 mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {parentCompany.name}
                            </h1>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <Hash className="h-4 w-4" />
                                Flow ID: {parentCompany.flowId || "Belirtilmemiş"}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleEditCompany}>
                        <Edit className="h-4 w-4" />
                        Düzenle
                    </Button>
                </div>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="companies">Bağlı Firmalar ({relatedCompanies.length})</TabsTrigger>
                    <TabsTrigger value="tickets">Talepler</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                İletişim Bilgileri
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="text-sm text-muted-foreground">E-posta</div>
                                    <div className="font-medium">{parentCompany.email || "Belirtilmemiş"}</div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="text-sm text-muted-foreground">Telefon</div>
                                    <div className="font-medium">{parentCompany.phone || "Belirtilmemiş"}</div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="text-sm text-muted-foreground">Adres</div>
                                    <div className="font-medium">{parentCompany.address || "Belirtilmemiş"}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Meta Information */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                Kayıt Bilgileri
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="text-sm text-muted-foreground">Oluşturulma Tarihi</div>
                                    <div className="font-medium">
                                        {format(new Date(parentCompany.createdAt), 'PPP', { locale: tr })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="text-sm text-muted-foreground">Oluşturan</div>
                                    <div className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {parentCompany.createdBy}
                                    </div>
                                </div>
                                {parentCompany.updatedAt && (
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="text-sm text-muted-foreground">Son Güncelleme</div>
                                        <div className="font-medium">
                                            {format(new Date(parentCompany.updatedAt), 'PPP', { locale: tr })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Notes */}
                        <Card className="p-6 md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Notlar</h3>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-[100px]">
                                {parentCompany.notes || "Bu ana firma için not bulunmuyor."}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="companies" className="flex-1 overflow-auto">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Bağlı Firmalar</h3>
                        {relatedCompanies.length === 0 ? (
                            <div className="text-center p-8">
                                <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg">Bağlı Firma Bulunamadı</h3>
                                <p className="text-muted-foreground">Bu ana firmaya bağlı firma kaydı bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {relatedCompanies.map(company => (
                                    <div key={company.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{company.name}</h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        {company.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">Görüntüle</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="tickets" className="flex-1 overflow-auto">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Talepler</h3>
                        <div className="text-center p-8">
                            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg">Talep Bulunamadı</h3>
                            <p className="text-muted-foreground">Bu ana firma için henüz talep kaydı bulunmuyor.</p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
