"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { 
    PlusCircle,
    Search,
    ChevronRight,
    Edit,
    Trash2,
    FolderPlus,
    Tag,
    Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CategoryHeader from "../components/CategoryHeader"
import CategoryForm from "../components/CategoryForm"
import SubcategoryForm from "../components/SubcategoryForm"
import GroupForm from "../components/GroupForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Category, Subcategory, Group, useCategories } from "@/providers/categories-provider"
import { CategoryService } from "./services/category-service"

// API'den dönen grup tipini tanımla
interface ApiGroup {
    id: string;
    name: string;
    description?: string;
    subcategoryId?: string;
    mesai_saatleri_sla?: number;
    mesai_disi_sla?: number;
    hafta_sonu_mesai_sla?: number;
    hafta_sonu_mesai_disi_sla?: number;
    sla_next_day_start?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export default function CategoryManagementPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false)
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null)
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    
    // CategoriesProvider'dan verileri al
    const { 
        categories, 
        subcategories,
        groups,
        loading, 
        error,
        refreshCategories,
        getSubcategoriesByCategoryId,
        getGroupsBySubcategoryId,
        addGroup,
        updateGroup,
        deleteGroup,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory
    } = useCategories()

    const { toast } = useToast()

    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddCategory = async (categoryData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden kategori oluştur
            const newCategory = await CategoryService.createUpdateCategory({
                ...categoryData,
                created_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, false)
            
            // Kategorileri yenile
            await refreshCategories()
            setIsAddCategoryOpen(false)
            
            toast({
                title: "Başarılı",
                description: "Kategori başarıyla eklendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Kategori eklenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Kategori eklenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateCategory = async (categoryData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden kategori güncelle
            const updatedCategory = await CategoryService.createUpdateCategory({
                ...categoryData,
                updated_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, true)
            
            // Kategorileri yenile
            await refreshCategories()
            setEditingCategory(null)
            
            toast({
                title: "Başarılı",
                description: "Kategori başarıyla güncellendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Kategori güncellenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Kategori güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem alt kategorileri ve grupları da silecektir.")) {
            try {
                // API üzerinden kategori sil
                await CategoryService.deleteCategory(categoryId)
                
                // Kategorileri yenile
                await refreshCategories()
                
                // Seçili kategori silinen kategoriyse seçimi temizle
                if (selectedCategory?.id === categoryId) {
                    setSelectedCategory(null)
                    setSelectedSubcategory(null)
                    setSelectedGroup(null)
                }
                
                toast({
                    title: "Başarılı",
                    description: "Kategori başarıyla silindi",
                    variant: "default",
                })
            } catch (error: any) {
                console.error('Kategori silinirken hata oluştu:', error)
                toast({
                    title: "Hata",
                    description: error.message || "Kategori silinirken bir hata oluştu",
                    variant: "destructive",
                })
            }
        }
    }

    const handleAddSubcategory = async (subcategoryData: any) => {
        if (!selectedCategory) return
        
        setIsSubmitting(true)
        try {
            // API üzerinden alt kategori oluştur
            const newSubcategory = await CategoryService.createUpdateSubcategory({
                ...subcategoryData,
                categoryId: selectedCategory.id,
                created_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, false)
            
            // Kategorileri yenile
            await refreshCategories()
            setIsAddSubcategoryOpen(false)
            
            toast({
                title: "Başarılı",
                description: "Alt kategori başarıyla eklendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Alt kategori eklenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Alt kategori eklenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateSubcategory = async (subcategoryData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden alt kategori güncelle
            const updatedSubcategory = await CategoryService.createUpdateSubcategory({
                ...subcategoryData,
                updated_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, true)
            
            // Kategorileri yenile
            await refreshCategories()
            setEditingSubcategory(null)
            
            toast({
                title: "Başarılı",
                description: "Alt kategori başarıyla güncellendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Alt kategori güncellenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Alt kategori güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSubcategory = async (subcategoryId: string) => {
        if (window.confirm("Bu alt kategoriyi silmek istediğinizden emin misiniz? Bu işlem grupları da silecektir.")) {
            try {
                // API üzerinden alt kategori sil
                await CategoryService.deleteSubcategory(subcategoryId)
                
                // Kategorileri yenile
                await refreshCategories()
                
                // Seçili alt kategori silinen alt kategoriyse seçimi temizle
                if (selectedSubcategory?.id === subcategoryId) {
                    setSelectedSubcategory(null)
                    setSelectedGroup(null)
                }
                
                toast({
                    title: "Başarılı",
                    description: "Alt kategori başarıyla silindi",
                    variant: "default",
                })
            } catch (error: any) {
                console.error('Alt kategori silinirken hata oluştu:', error)
                toast({
                    title: "Hata",
                    description: error.message || "Alt kategori silinirken bir hata oluştu",
                    variant: "destructive",
                })
            }
        }
    }

    const handleAddGroup = async (groupData: any) => {
        if (!selectedSubcategory) return
        
        setIsSubmitting(true)
        try {
            // API üzerinden grup oluştur
            const newGroup = await CategoryService.createUpdateGroup({
                ...groupData,
                subcategoryId: selectedSubcategory.id,
                // Alan isimlerini API'nin beklediği formata dönüştür
                mesai_saatleri_sla: groupData.mesaiSaatleriSla,
                mesai_disi_sla: groupData.mesaiDisiSla,
                hafta_sonu_mesai_sla: groupData.haftaSonuMesaiSla,
                hafta_sonu_mesai_disi_sla: groupData.haftaSonuMesaiDisiSla,
                sla_next_day_start: groupData.slaNextDayStart,
                created_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, false)
            
            // API'den tüm verileri yeniden çekmek yerine yerel state'i güncelle
            if (newGroup) {
                // API'den dönen veriyi camelCase formatına dönüştür
                const apiGroup = newGroup as ApiGroup;
                const formattedGroup: Group = {
                    id: apiGroup.id,
                    name: apiGroup.name,
                    description: apiGroup.description || "",
                    subcategoryId: apiGroup.subcategoryId || selectedSubcategory.id,
                    mesaiSaatleriSla: apiGroup.mesai_saatleri_sla || 0,
                    mesaiDisiSla: apiGroup.mesai_disi_sla || 0,
                    haftaSonuMesaiSla: apiGroup.hafta_sonu_mesai_sla || 0,
                    haftaSonuMesaiDisiSla: apiGroup.hafta_sonu_mesai_disi_sla || 0,
                    slaNextDayStart: apiGroup.sla_next_day_start || false,
                    createdAt: apiGroup.created_at || new Date().toISOString(),
                    updatedAt: apiGroup.updated_at || new Date().toISOString()
                };
                
                // Context'teki yerel state'i güncelle
                addGroup(formattedGroup);
            }
            
            setIsAddGroupOpen(false)
            
            toast({
                title: "Başarılı",
                description: "Grup başarıyla eklendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Grup eklenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Grup eklenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateGroup = async (groupData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden grup güncelle
            const updatedGroup = await CategoryService.createUpdateGroup({
                ...groupData,
                // Alan isimlerini API'nin beklediği formata dönüştür
                mesai_saatleri_sla: groupData.mesaiSaatleriSla,
                mesai_disi_sla: groupData.mesaiDisiSla,
                hafta_sonu_mesai_sla: groupData.haftaSonuMesaiSla,
                hafta_sonu_mesai_disi_sla: groupData.haftaSonuMesaiDisiSla,
                sla_next_day_start: groupData.slaNextDayStart,
                updated_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, true)
            
            // API'den tüm verileri yeniden çekmek yerine yerel state'i güncelle
            if (updatedGroup) {
                // API'den dönen veriyi camelCase formatına dönüştür
                const apiGroup = updatedGroup as ApiGroup;
                const formattedGroup: Group = {
                    id: apiGroup.id,
                    name: apiGroup.name,
                    description: apiGroup.description || "",
                    subcategoryId: apiGroup.subcategoryId || "",
                    mesaiSaatleriSla: apiGroup.mesai_saatleri_sla || 0,
                    mesaiDisiSla: apiGroup.mesai_disi_sla || 0,
                    haftaSonuMesaiSla: apiGroup.hafta_sonu_mesai_sla || 0,
                    haftaSonuMesaiDisiSla: apiGroup.hafta_sonu_mesai_disi_sla || 0,
                    slaNextDayStart: apiGroup.sla_next_day_start || false,
                    createdAt: apiGroup.created_at || new Date().toISOString(),
                    updatedAt: apiGroup.updated_at || new Date().toISOString()
                };
                
                // Context'teki yerel state'i güncelle
                updateGroup(formattedGroup);
            }
            
            setEditingGroup(null)
            
            toast({
                title: "Başarılı",
                description: "Grup başarıyla güncellendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Grup güncellenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Grup güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (window.confirm("Bu grubu silmek istediğinizden emin misiniz?")) {
            try {
                // API üzerinden grup sil
                await CategoryService.deleteGroup(groupId)
                
                // API'den tüm verileri yeniden çekmek yerine yerel state'i güncelle
                deleteGroup(groupId);
                
                // Seçili grup silinen grupsa seçimi temizle
                if (selectedGroup?.id === groupId) {
                    setSelectedGroup(null)
                }
                
                toast({
                    title: "Başarılı",
                    description: "Grup başarıyla silindi",
                    variant: "default",
                })
            } catch (error: any) {
                console.error('Grup silinirken hata oluştu:', error)
                toast({
                    title: "Hata",
                    description: error.message || "Grup silinirken bir hata oluştu",
                    variant: "destructive",
                })
            }
        }
    }

    const handleCategoryClick = (category: Category) => {
        // Gerekli alanları ekleyerek tip uyumluluğunu sağla
        const safeCategory: Category = {
            ...category,
            createdAt: category.createdAt || new Date().toISOString(),
            updatedAt: category.updatedAt || new Date().toISOString()
        };
        setSelectedCategory(safeCategory);
        setSelectedSubcategory(null);
        setSelectedGroup(null);
    }

    const handleSubcategoryClick = (subcategory: Subcategory) => {
        try {
            // Gerekli alanları ekleyerek tip uyumluluğunu sağla
            const safeSubcategory: Subcategory = {
                ...subcategory,
                createdAt: subcategory.createdAt || new Date().toISOString(),
                updatedAt: subcategory.updatedAt || new Date().toISOString(),
                categoryId: subcategory.categoryId || ''
            };
            setSelectedSubcategory(safeSubcategory);
            setSelectedGroup(null);
        } catch (error) {
            console.error("Error in handleSubcategoryClick:", error)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <CategoryHeader />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 w-full md:w-1/3">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Kategori ara..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <Button 
                    className="flex items-center gap-2"
                    onClick={() => setIsAddCategoryOpen(true)}
                    disabled={isSubmitting}
                >
                    <PlusCircle className="h-4 w-4" />
                    Yeni Kategori
                </Button>
                
                {isAddCategoryOpen && (
                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                            </DialogHeader>
                            <CategoryForm onSubmit={handleAddCategory} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                {/* Categories List */}
                <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-semibold">Kategoriler</h3>
                    </div>
                    <div className="overflow-y-auto h-[calc(85vh-16rem)]">
                        {loading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="p-4 text-center">Kategori bulunamadı</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredCategories.map((category) => (
                                    <li key={category.id} className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${selectedCategory?.id === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center gap-2 flex-1"
                                                onClick={() => handleCategoryClick(category)}
                                            >
                                                <ChevronRight className={`h-4 w-4 transition-transform ${selectedCategory?.id === category.id ? 'rotate-90' : ''}`} />
                                                <span>{category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingCategory(category.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                
                                                {editingCategory === category.id && (
                                                    <Dialog open={true} onOpenChange={(open) => {
                                                        if (!open) setEditingCategory(null);
                                                    }}>
                                                        <DialogContent className="sm:max-w-[500px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Kategori Düzenle</DialogTitle>
                                                            </DialogHeader>
                                                            <CategoryForm category={category} onSubmit={handleUpdateCategory} />
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>

                {/* Subcategories List */}
                <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-semibold">Alt Kategoriler</h3>
                        {selectedCategory && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => setIsAddSubcategoryOpen(true)}
                                disabled={isSubmitting}
                            >
                                <FolderPlus className="h-4 w-4" />
                                Ekle
                            </Button>
                        )}
                        
                        {isAddSubcategoryOpen && (
                            <Dialog open={isAddSubcategoryOpen} onOpenChange={setIsAddSubcategoryOpen}>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Yeni Alt Kategori Ekle</DialogTitle>
                                    </DialogHeader>
                                    <SubcategoryForm onSubmit={handleAddSubcategory} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="overflow-y-auto h-[calc(85vh-16rem)]">
                        {!selectedCategory ? (
                            <div className="p-4 text-center text-muted-foreground">
                                Lütfen bir kategori seçin
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {getSubcategoriesByCategoryId(selectedCategory.id).map((subcategory) => (
                                    <li key={subcategory.id} className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${selectedSubcategory?.id === subcategory.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center gap-2 flex-1"
                                                onClick={() => handleSubcategoryClick(subcategory)}
                                            >
                                                <ChevronRight className={`h-4 w-4 transition-transform ${selectedSubcategory?.id === subcategory.id ? 'rotate-90' : ''}`} />
                                                <span>{subcategory.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingSubcategory(subcategory.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                
                                                {editingSubcategory === subcategory.id && (
                                                    <Dialog open={true} onOpenChange={(open) => {
                                                        if (!open) setEditingSubcategory(null);
                                                    }}>
                                                        <DialogContent className="sm:max-w-[500px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Alt Kategori Düzenle</DialogTitle>
                                                            </DialogHeader>
                                                            <SubcategoryForm subcategory={subcategory} onSubmit={handleUpdateSubcategory} />
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteSubcategory(subcategory.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>

                {/* Groups List */}
                <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-semibold">Gruplar</h3>
                        {selectedSubcategory && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => setIsAddGroupOpen(true)}
                                disabled={isSubmitting}
                            >
                                <Tag className="h-4 w-4" />
                                Ekle
                            </Button>
                        )}
                        
                        {isAddGroupOpen && (
                            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Yeni Grup Ekle</DialogTitle>
                                    </DialogHeader>
                                    <GroupForm onSubmit={handleAddGroup} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="overflow-y-auto h-[calc(85vh-16rem)]">
                        {!selectedSubcategory ? (
                            <div className="p-4 text-center text-muted-foreground">
                                Lütfen bir alt kategori seçin
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {getGroupsBySubcategoryId(selectedSubcategory.id).map((group) => (
                                    <li key={group.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="font-medium">{group.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8"
                                                        onClick={() => setEditingGroup(group.id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    {editingGroup === group.id && (
                                                        <Dialog open={true} onOpenChange={(open) => {
                                                            if (!open) setEditingGroup(null);
                                                        }}>
                                                            <DialogContent className="sm:max-w-[500px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Grup Düzenle</DialogTitle>
                                                                </DialogHeader>
                                                                <GroupForm group={group} onSubmit={handleUpdateGroup} />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                    
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Mesai Saatleri SLA:</span>
                                                    <span className="ml-2 font-medium">{group.mesaiSaatleriSla || 60} dk</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Mesai Dışı SLA:</span>
                                                    <span className="ml-2 font-medium">{group.mesaiDisiSla || 120} dk</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">H.Sonu Mesai SLA:</span>
                                                    <span className="ml-2 font-medium">{group.haftaSonuMesaiSla || 180} dk</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">H.Sonu Mesai Dışı SLA:</span>
                                                    <span className="ml-2 font-medium">{group.haftaSonuMesaiDisiSla || 240} dk</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground">SLA sonraki gün başlar:</span>
                                                    <span className="ml-2 font-medium">{group.slaNextDayStart ? 'Evet' : 'Hayır'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
