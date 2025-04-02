"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Folder, Layers, Loader2, Search, FileText } from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
import { useCategories } from "@/providers/categories-provider"
import ReactSelect from "react-select"
import { debounce } from "lodash"

interface CategoryFormProps {
  categoryId: string
  subcategoryId: string
  groupId: string
  onCategoryIdChange: (value: string) => void
  onSubcategoryIdChange: (value: string) => void
  onGroupIdChange: (value: string) => void
  isLoading?: boolean
}

export default function CategoryForm({
  categoryId,
  subcategoryId,
  groupId,
  onCategoryIdChange,
  onSubcategoryIdChange,
  onGroupIdChange,
  isLoading
}: CategoryFormProps) {
  // Provider'dan veri al
  const {
    categories,
    getSubcategoriesByCategoryId,
    getGroupsBySubcategoryId,
    loading
  } = useCategories();

  // Arama için state'ler
  const [categoryInputValue, setCategoryInputValue] = useState("");
  const [subcategoryInputValue, setSubcategoryInputValue] = useState("");
  const [groupInputValue, setGroupInputValue] = useState("");

  // Filtrelenmiş veriler
  const [searchedCategories, setSearchedCategories] = useState<any[]>([]);
  const [searchedSubcategories, setSearchedSubcategories] = useState<any[]>([]);
  const [searchedGroups, setSearchedGroups] = useState<any[]>([]);

  // Seçilen kategoriye göre alt kategorileri al
  const subcategories = useMemo(() => {
    return categoryId ? getSubcategoriesByCategoryId(categoryId) : [];
  }, [categoryId, getSubcategoriesByCategoryId]);

  // Seçilen alt kategoriye göre grupları al
  const groups = useMemo(() => {
    return subcategoryId ? getGroupsBySubcategoryId(subcategoryId) : [];
  }, [subcategoryId, getGroupsBySubcategoryId]);

  // Kategori seçimi
  const handleCategorySelect = (id: string) => {
    onCategoryIdChange(id);
    // Kategori değiştiğinde alt kategori ve grup seçimini sıfırla
    onSubcategoryIdChange("");
    onGroupIdChange("");
  };

  // Alt kategori seçimi
  const handleSubcategorySelect = (id: string) => {
    onSubcategoryIdChange(id);
    // Alt kategori değiştiğinde grup seçimini sıfırla
    onGroupIdChange("");
  };

  // Grup seçimi
  const handleGroupSelect = (id: string) => {
    onGroupIdChange(id);
  };

  // Kategori arama fonksiyonu
  const searchCategories = useMemo(() =>
    debounce((inputValue: string) => {
      if (!inputValue) {
        setSearchedCategories([]);
        return;
      }

      const searchTerm = inputValue.toLowerCase();
      const results = categories
        .filter(category =>
          category.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 100); // Sadece ilk 100 sonucu göster

      setSearchedCategories(results);
    }, 300),
    [categories]);

  // Alt kategori arama fonksiyonu
  const searchSubcategories = useMemo(() =>
    debounce((inputValue: string) => {
      if (!inputValue) {
        setSearchedSubcategories([]);
        return;
      }

      const searchTerm = inputValue.toLowerCase();
      const results = subcategories
        .filter(subcategory =>
          subcategory.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 100); // Sadece ilk 100 sonucu göster

      setSearchedSubcategories(results);
    }, 300),
    [subcategories]);

  // Grup arama fonksiyonu
  const searchGroups = useMemo(() =>
    debounce((inputValue: string) => {
      if (!inputValue) {
        setSearchedGroups([]);
        return;
      }

      const searchTerm = inputValue.toLowerCase();
      const results = groups
        .filter(group =>
          group.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 100); // Sadece ilk 100 sonucu göster

      setSearchedGroups(results);
    }, 300),
    [groups]);

  // Kategori input değeri değiştiğinde
  const handleCategoryInputChange = (inputValue: string) => {
    setCategoryInputValue(inputValue);
    searchCategories(inputValue);
  };

  // Alt kategori input değeri değiştiğinde
  const handleSubcategoryInputChange = (inputValue: string) => {
    setSubcategoryInputValue(inputValue);
    searchSubcategories(inputValue);
  };

  // Grup input değeri değiştiğinde
  const handleGroupInputChange = (inputValue: string) => {
    setGroupInputValue(inputValue);
    searchGroups(inputValue);
  };

  // Kategori seçenekleri
  const categoryOptions = useMemo(() => {
    if (categoryInputValue.length > 0) {
      return [
        { value: "", label: "Seçiniz" },
        ...searchedCategories.map(category => ({
          value: category.id,
          label: category.name
        }))
      ];
    }

    // Input değeri yoksa, tüm kategorileri göster
    return [
      { value: "", label: "Seçiniz" },
      ...categories.map(category => ({
        value: category.id,
        label: category.name
      }))
    ];
  }, [categories, searchedCategories, categoryInputValue]);

  // Alt kategori seçenekleri
  const subcategoryOptions = useMemo(() => {
    if (subcategoryInputValue.length > 0) {
      return [
        { value: "", label: "Seçiniz" },
        ...searchedSubcategories.map(subcategory => ({
          value: subcategory.id,
          label: subcategory.name
        }))
      ];
    }

    // Input değeri yoksa, seçilen kategoriye ait tüm alt kategorileri göster
    return [
      { value: "", label: "Seçiniz" },
      ...subcategories.map(subcategory => ({
        value: subcategory.id,
        label: subcategory.name
      }))
    ];
  }, [subcategories, searchedSubcategories, subcategoryInputValue]);

  // Grup seçenekleri
  const groupOptions = useMemo(() => {
    if (groupInputValue.length > 0) {
      return [
        { value: "", label: "Seçiniz" },
        ...searchedGroups.map(group => ({
          value: group.id,
          label: group.name
        }))
      ];
    }

    // Input değeri yoksa, seçilen alt kategoriye ait tüm grupları göster
    return [
      { value: "", label: "Seçiniz" },
      ...groups.map(group => ({
        value: group.id,
        label: group.name
      }))
    ];
  }, [groups, searchedGroups, groupInputValue]);

  const menuPortalTarget = typeof document !== 'undefined' ? document.body : null;

  // Tüm ReactSelect bileşenleri için ortak stiller
  const selectClassNames = {
    control: (state) => `w-full bg-background/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-150 rounded-md h-8 px-2 py-1 flex items-center justify-between ${state.isFocused ? 'border-primary ring-1 ring-primary' : ''}`,
    menu: () => "bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-md mt-1 z-50 dark:bg-slate-950 dark:border-slate-800",
    menuList: () => "py-1 px-1",
    option: (state) => `cursor-pointer transition-colors py-1.5 px-2 rounded-sm text-xs flex items-center ${state.isFocused ? 'bg-accent text-accent-foreground dark:bg-slate-800 dark:text-white' : ''} ${state.isSelected ? 'bg-primary text-primary-foreground font-medium' : ''}`,
    singleValue: () => "text-foreground dark:text-white flex items-center text-xs",
    placeholder: () => "text-muted-foreground dark:text-slate-400 text-xs",
    valueContainer: () => "flex items-center gap-1"
  }

  // Özel stiller
  const selectStyles = {
    control: (base) => ({
      ...base,
      boxShadow: 'none',
      minHeight: '32px'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--foreground)',
      opacity: 0.5,
      padding: '0 4px'
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '0 4px'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 6px'
    })
  }

  // Select tema ayarları
  const selectTheme = (theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: 'var(--primary)',
      primary25: 'var(--accent)',
      neutral0: 'var(--background)',
      neutral80: 'var(--foreground)'
    }
  })

  const categorySelectClassNames = {
    ...selectClassNames,
    menu: () => "bg-background border rounded-md shadow-md mt-1 z-[1000]",
  }

  const subcategorySelectClassNames = {
    ...selectClassNames,
    menu: () => "bg-background border rounded-md shadow-md mt-1 z-[1500]",
  }

  const groupSelectClassNames = {
    ...selectClassNames,
    menu: () => "bg-background border rounded-md shadow-md mt-1 z-[2000]",
  }

  const categorySelectStyles = {
    ...selectStyles,
    menuPortal: (base: any) => ({ ...base, zIndex: 1000 }),
  }

  const subcategorySelectStyles = {
    ...selectStyles,
    menuPortal: (base: any) => ({ ...base, zIndex: 1500 }),
  }

  const groupSelectStyles = {
    ...selectStyles,
    menuPortal: (base: any) => ({ ...base, zIndex: 2000 }),
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1.5">Kategori Bilgileri</h3>
        <div className="space-y-1.5 max-w-full overflow-hidden">
          <div className="flex items-start space-x-2">
            <Folder className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
            <div className="w-full relative">
              <ReactSelect
                value={categoryId ? {
                  value: categoryId,
                  label: categories.find(c => c.id === categoryId)?.name || "Kategori seçin"
                } : null}
                onChange={(option: any) => {
                  if (option) {
                    handleCategorySelect(option.value);
                  } else {
                    handleCategorySelect("");
                  }
                }}
                options={categoryOptions}
                placeholder="Kategori seçin"
                noOptionsMessage={() => "Kategori bulunamadı"}
                loadingMessage={() => "Yükleniyor..."}
                isLoading={isLoading || loading}
                isClearable
                unstyled
                theme={selectTheme}
                onInputChange={handleCategoryInputChange}
                filterOption={() => true} // Disable built-in filtering
                classNames={categorySelectClassNames}
                styles={categorySelectStyles}
                components={{
                  LoadingIndicator: () => (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )
                }}
                menuPortalTarget={menuPortalTarget}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Layers className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
            <div className="w-full relative">
              <ReactSelect
                value={subcategoryId ? {
                  value: subcategoryId,
                  label: subcategories.find(s => s.id === subcategoryId)?.name || "Alt kategori seçin"
                } : null}
                onChange={(option: any) => {
                  if (option) {
                    handleSubcategorySelect(option.value);
                  } else {
                    handleSubcategorySelect("");
                  }
                }}
                options={subcategoryOptions}
                placeholder="Alt kategori seçin"
                noOptionsMessage={() => categoryId ? "Alt kategori bulunamadı" : "Önce kategori seçin"}
                loadingMessage={() => "Yükleniyor..."}
                isLoading={isLoading || loading}
                isClearable
                unstyled
                theme={selectTheme}
                isDisabled={!categoryId}
                onInputChange={handleSubcategoryInputChange}
                filterOption={() => true} // Disable built-in filtering
                classNames={subcategorySelectClassNames}
                styles={subcategorySelectStyles}
                components={{
                  LoadingIndicator: () => (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )
                }}
                menuPortalTarget={menuPortalTarget}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
            <div className="w-full relative">
              <ReactSelect
                value={groupId ? {
                  value: groupId,
                  label: groups.find(g => g.id === groupId)?.name || "Grup seçin"
                } : null}
                onChange={(option: any) => {
                  if (option) {
                    handleGroupSelect(option.value);
                  } else {
                    handleGroupSelect("");
                  }
                }}
                options={groupOptions}
                placeholder="Grup seçin"
                noOptionsMessage={() => subcategoryId ? "Grup bulunamadı" : "Önce alt kategori seçin"}
                loadingMessage={() => "Yükleniyor..."}
                isLoading={isLoading || loading}
                isClearable
                unstyled
                theme={selectTheme}
                isDisabled={!subcategoryId}
                onInputChange={handleGroupInputChange}
                filterOption={() => true} // Disable built-in filtering
                classNames={groupSelectClassNames}
                styles={groupSelectStyles}
                components={{
                  LoadingIndicator: () => (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )
                }}
                menuPortalTarget={menuPortalTarget}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
