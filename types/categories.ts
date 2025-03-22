export interface Category {
    id: string;
    name: string;
    description?: string;
    subcategories?: Subcategory[];
    createdAt: string;
    updatedAt: string;
}

export interface Subcategory {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    groups?: Group[];
    createdAt: string;
    updatedAt: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    subcategoryId: string;
    mesaiSaatleriSla?: number;
    mesaiDisiSla?: number;
    haftaSonuMesaiSla?: number;
    haftaSonuMesaiDisiSla?: number;
    slaNextDayStart?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryFilter {
    searchTerm?: string;
}
