import { create } from 'zustand';
import { Category, Subcategory, Group, CategoryFilter } from '@/types/categories';

interface CategoryStore {
    categories: Category[];
    selectedCategory: Category | null;
    selectedSubcategory: Subcategory | null;
    selectedGroup: Group | null;
    filters: CategoryFilter;
    isLoading: boolean;
    error: string | null;
    
    // Category actions
    setCategories: (categories: Category[]) => void;
    addCategory: (category: Category) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (categoryId: string) => void;
    setSelectedCategory: (category: Category | null) => void;
    
    // Subcategory actions
    addSubcategory: (subcategory: Subcategory) => void;
    updateSubcategory: (subcategory: Subcategory) => void;
    deleteSubcategory: (subcategoryId: string) => void;
    setSelectedSubcategory: (subcategory: Subcategory | null) => void;
    
    // Group actions
    addGroup: (group: Group) => void;
    updateGroup: (group: Group) => void;
    deleteGroup: (groupId: string) => void;
    setSelectedGroup: (group: Group | null) => void;
    
    // Other actions
    setFilters: (filters: CategoryFilter) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
    categories: [],
    selectedCategory: null,
    selectedSubcategory: null,
    selectedGroup: null,
    filters: {},
    isLoading: false,
    error: null,
    
    // Category actions
    setCategories: (categories) => set({ categories }),
    addCategory: (category) => set((state) => ({ 
        categories: [...state.categories, category] 
    })),
    updateCategory: (category) => set((state) => ({
        categories: state.categories.map((c) => c.id === category.id ? category : c),
        selectedCategory: state.selectedCategory?.id === category.id ? category : state.selectedCategory
    })),
    deleteCategory: (categoryId) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        selectedCategory: state.selectedCategory?.id === categoryId ? null : state.selectedCategory,
        selectedSubcategory: state.selectedSubcategory?.categoryId === categoryId ? null : state.selectedSubcategory,
        selectedGroup: state.selectedGroup && 
            state.categories.find(c => c.id === categoryId)?.subcategories?.some(s => s.id === state.selectedGroup?.subcategoryId) 
            ? null 
            : state.selectedGroup
    })),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    
    // Subcategory actions
    addSubcategory: (subcategory) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            if (category.id === subcategory.categoryId) {
                return {
                    ...category,
                    subcategories: [...(category.subcategories || []), subcategory]
                };
            }
            return category;
        });
        
        return { categories: updatedCategories };
    }),
    updateSubcategory: (subcategory) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            if (category.id === subcategory.categoryId) {
                return {
                    ...category,
                    subcategories: (category.subcategories || []).map((s) => 
                        s.id === subcategory.id ? subcategory : s
                    )
                };
            }
            return category;
        });
        
        return { 
            categories: updatedCategories,
            selectedSubcategory: state.selectedSubcategory?.id === subcategory.id ? subcategory : state.selectedSubcategory
        };
    }),
    deleteSubcategory: (subcategoryId) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            return {
                ...category,
                subcategories: (category.subcategories || []).filter((s) => s.id !== subcategoryId)
            };
        });
        
        return { 
            categories: updatedCategories,
            selectedSubcategory: state.selectedSubcategory?.id === subcategoryId ? null : state.selectedSubcategory,
            selectedGroup: state.selectedGroup?.subcategoryId === subcategoryId ? null : state.selectedGroup
        };
    }),
    setSelectedSubcategory: (subcategory) => set({ 
        selectedSubcategory: subcategory ? {
            ...subcategory,
            id: subcategory.id || '',
            name: subcategory.name || '',
            description: subcategory.description || '',
            categoryId: subcategory.categoryId || '',
            groups: subcategory.groups || [],
            createdAt: subcategory.createdAt || new Date().toISOString(),
            updatedAt: subcategory.updatedAt || new Date().toISOString()
        } : null 
    }),
    
    // Group actions
    addGroup: (group) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            return {
                ...category,
                subcategories: (category.subcategories || []).map((subcategory) => {
                    if (subcategory.id === group.subcategoryId) {
                        return {
                            ...subcategory,
                            groups: [...(subcategory.groups || []), group]
                        };
                    }
                    return subcategory;
                })
            };
        });
        
        return { categories: updatedCategories };
    }),
    updateGroup: (group) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            return {
                ...category,
                subcategories: (category.subcategories || []).map((subcategory) => {
                    if (subcategory.id === group.subcategoryId) {
                        return {
                            ...subcategory,
                            groups: (subcategory.groups || []).map((g) => 
                                g.id === group.id ? group : g
                            )
                        };
                    }
                    return subcategory;
                })
            };
        });
        
        return { 
            categories: updatedCategories,
            selectedGroup: state.selectedGroup?.id === group.id ? group : state.selectedGroup
        };
    }),
    deleteGroup: (groupId) => set((state) => {
        const updatedCategories = state.categories.map((category) => {
            return {
                ...category,
                subcategories: (category.subcategories || []).map((subcategory) => {
                    return {
                        ...subcategory,
                        groups: (subcategory.groups || []).filter((g) => g.id !== groupId)
                    };
                })
            };
        });
        
        return { 
            categories: updatedCategories,
            selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup
        };
    }),
    setSelectedGroup: (group) => set({ selectedGroup: group }),
    
    // Other actions
    setFilters: (filters) => set({ filters }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error })
}));
