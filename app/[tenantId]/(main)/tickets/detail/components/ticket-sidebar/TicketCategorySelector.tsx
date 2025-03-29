"use client"

import React from "react"
import { Folder, Loader2 } from "lucide-react"
import ReactSelect from "react-select"
import { BaseTicketComponentProps, Category, Subcategory, Group, SelectOption } from "./types"

interface TicketCategorySelectorProps extends BaseTicketComponentProps {
    categories: Category[];
    groups: Group[];
    selectedCategoryId?: string;
    selectedSubcategoryId?: string;
    selectedGroupId?: string;
    handleCategoryChange: (categoryId?: string) => void;
    handleSubcategoryChange: (subcategoryId?: string) => void;
    handleGroupChange: (groupId?: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

const TicketCategorySelector: React.FC<TicketCategorySelectorProps> = ({
    categories,
    groups,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedGroupId,
    handleCategoryChange,
    handleSubcategoryChange,
    handleGroupChange,
    selectClassNames,
    selectStyles,
    selectTheme,
    menuPortalTarget,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-500">Kategoriler yükleniyor...</span>
            </div>
        );
    }

    // Get the selected category
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

    // Create category options
    const categoryOptions: SelectOption[] = categories.map(category => ({
        value: category.id,
        label: category.name
    }));

    // Create subcategory options based on selected category
    const subcategoryOptions: SelectOption[] = selectedCategory
        ? selectedCategory.subcategories.map(subcategory => ({
            value: subcategory.id,
            label: subcategory.name
        }))
        : [];

    // Create group options
    const groupOptions: SelectOption[] = groups.map(group => ({
        value: group.id,
        label: group.name
    }));

    return (
        <div className="space-y-3">
            {/* Kategori */}
            <div>
                <h3 className="text-sm font-semibold mb-1.5">Kategori</h3>
                <div className="flex items-start space-x-2">
                    <Folder className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="w-full">
                        <ReactSelect
                            options={categoryOptions}
                            value={categoryOptions.find(option => option.value === selectedCategoryId)}
                            onChange={(option) => handleCategoryChange(option?.value)}
                            placeholder="Seçiniz"
                            className="w-full"
                            classNames={selectClassNames}
                            styles={selectStyles}
                            menuPortalTarget={menuPortalTarget}
                            unstyled
                            theme={selectTheme}
                        />
                    </div>
                </div>
            </div>

            {/* Alt Kategori */}
            <div>
                <h3 className="text-sm font-semibold mb-1.5">Alt Kategori</h3>
                <div className="flex items-start space-x-2">
                    <Folder className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="w-full">
                        <ReactSelect
                            options={subcategoryOptions}
                            value={subcategoryOptions.find(option => option.value === selectedSubcategoryId)}
                            onChange={(option) => handleSubcategoryChange(option?.value)}
                            placeholder={selectedCategoryId ? "Seçiniz" : "Önce kategori seçin"}
                            className="w-full"
                            classNames={selectClassNames}
                            styles={selectStyles}
                            menuPortalTarget={menuPortalTarget}
                            unstyled
                            theme={selectTheme}
                            isDisabled={!selectedCategoryId}
                        />
                    </div>
                </div>
            </div>

            {/* Grup */}
            <div>
                <h3 className="text-sm font-semibold mb-1.5">Grup</h3>
                <div className="flex items-start space-x-2">
                    <Folder className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="w-full">
                        <ReactSelect
                            options={groupOptions}
                            value={groupOptions.find(option => option.value === selectedGroupId)}
                            onChange={(option) => handleGroupChange(option?.value)}
                            placeholder="Seçiniz"
                            className="w-full"
                            classNames={selectClassNames}
                            styles={selectStyles}
                            menuPortalTarget={menuPortalTarget}
                            unstyled
                            theme={selectTheme}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketCategorySelector;
