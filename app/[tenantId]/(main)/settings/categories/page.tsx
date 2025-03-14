"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    PlusCircle, 
    Search, 
    ChevronRight,
    Edit,
    Trash2,
    FolderPlus,
    Tag
} from "lucide-react"
import { useCategoryStore } from "@/stores/category-store"
import { mockCategories } from "../data/mock-categories"
import CategoryHeader from "../components/CategoryHeader"
import CategoryForm from "../components/CategoryForm"
import SubcategoryForm from "../components/SubcategoryForm"
import GroupForm from "../components/GroupForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Category, Subcategory, Group } from "@/types/categories"

export default function CategoryManagementPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false)
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null)
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    
    const { 
        categories, 
        setCategories, 
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        selectedGroup,
        setSelectedGroup,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        addGroup,
        updateGroup,
        deleteGroup,
        isLoading
    } = useCategoryStore()

    useEffect(() => {
        setCategories(mockCategories)
    }, [setCategories])

    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddCategory = (categoryData: any) => {
        const newCategory = {
            ...categoryData,
            id: `CAT-${String(categories.length + 1).padStart(3, '0')}`,
            subcategories: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        addCategory(newCategory)
        setIsAddCategoryOpen(false)
    }

    const handleUpdateCategory = (categoryData: any) => {
        updateCategory({
            ...categoryData,
            updatedAt: new Date().toISOString()
        })
        setEditingCategory(null)
    }

    const handleDeleteCategory = (categoryId: string) => {
        if (window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem alt kategorileri ve grupları da silecektir.")) {
            deleteCategory(categoryId)
        }
    }

    const handleAddSubcategory = (subcategoryData: any) => {
        if (!selectedCategory) return
        
        const newSubcategory = {
            ...subcategoryData,
            id: `SUB-${String(
                categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0) + 1
            ).padStart(3, '0')}`,
            categoryId: selectedCategory.id,
            groups: [], // Ensure groups is always initialized as an empty array
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        addSubcategory(newSubcategory)
        setIsAddSubcategoryOpen(false)
    }

    const handleUpdateSubcategory = (subcategoryData: any) => {
        updateSubcategory({
            ...subcategoryData,
            updatedAt: new Date().toISOString()
        })
        setEditingSubcategory(null)
    }

    const handleDeleteSubcategory = (subcategoryId: string) => {
        if (window.confirm("Bu alt kategoriyi silmek istediğinizden emin misiniz? Bu işlem grupları da silecektir.")) {
            deleteSubcategory(subcategoryId)
        }
    }

    const handleAddGroup = (groupData: any) => {
        if (!selectedSubcategory) return
        
        const newGroup = {
            ...groupData,
            id: `GRP-${String(
                categories.reduce((acc, cat) => 
                    acc + (cat.subcategories?.reduce((sacc, sub) => 
                        sacc + (sub.groups?.length || 0), 0
                    ) || 0), 0) + 1
            ).padStart(3, '0')}`,
            subcategoryId: selectedSubcategory.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        addGroup(newGroup)
        setIsAddGroupOpen(false)
    }

    const handleUpdateGroup = (groupData: any) => {
        updateGroup({
            ...groupData,
            updatedAt: new Date().toISOString()
        })
        setEditingGroup(null)
    }

    const handleDeleteGroup = (groupId: string) => {
        if (window.confirm("Bu grubu silmek istediğinizden emin misiniz?")) {
            deleteGroup(groupId)
        }
    }

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category)
        setSelectedSubcategory(null)
        setSelectedGroup(null)
    }

    const handleSubcategoryClick = (subcategory: Subcategory) => {
        try {
            // Create a safe copy with all required properties
            const safeSubcategory = {
                ...subcategory,
                id: subcategory.id || '',
                name: subcategory.name || '',
                description: subcategory.description || '',
                categoryId: subcategory.categoryId || '',
                groups: Array.isArray(subcategory.groups) ? subcategory.groups : [],
                createdAt: subcategory.createdAt || new Date().toISOString(),
                updatedAt: subcategory.updatedAt || new Date().toISOString()
            };
            
            console.log("Setting selected subcategory:", safeSubcategory);
            setSelectedSubcategory(safeSubcategory);
            setSelectedGroup(null);
        } catch (error) {
            console.error("Error in handleSubcategoryClick:", error);
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
                        {isLoading ? (
                            <div className="p-4 text-center">Yükleniyor...</div>
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
                        ) : isLoading ? (
                            <div className="p-4 text-center">Yükleniyor...</div>
                        ) : !selectedCategory.subcategories || selectedCategory.subcategories.length === 0 ? (
                            <div className="p-4 text-center">Alt kategori bulunamadı</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {selectedCategory.subcategories.map((subcategory) => (
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
                        ) : isLoading ? (
                            <div className="p-4 text-center">Yükleniyor...</div>
                        ) : !selectedSubcategory.groups || selectedSubcategory.groups.length === 0 ? (
                            <div className="p-4 text-center">Grup bulunamadı</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {selectedSubcategory.groups.map((group) => (
                                    <li key={group.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1">
                                                <span>{group.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingGroup(group.id)}
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
            </div>
        </div>
    )
}
