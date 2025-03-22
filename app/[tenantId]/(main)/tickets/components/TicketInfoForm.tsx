"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquare, Paperclip, X } from "lucide-react"
import ReactSelect from "react-select"

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface TicketInfoFormProps {
  title: string
  description: string
  category: string
  subcategory: string
  group: string
  priority: string
  files: File[]
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSubcategoryChange: (value: string) => void
  onGroupChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileRemove: (index: number) => void
  categories: Category[]
  subcategories: Subcategory[]
  groups: Group[]
  isLoadingCategories: boolean
  isLoadingSubcategories: boolean
  isLoadingGroups: boolean
  categoryName?: string
  subcategoryName?: string
  groupName?: string
  group_name?: string
}

export default function TicketInfoForm({
  title,
  description,
  category,
  subcategory,
  group,
  priority,
  files,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onGroupChange,
  onPriorityChange,
  onFileChange,
  onFileRemove,
  categories = [],
  subcategories = [],
  groups = [],
  isLoadingCategories = false,
  isLoadingSubcategories = false,
  isLoadingGroups = false,
  categoryName,
  subcategoryName,
  groupName,
  group_name
}: TicketInfoFormProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Talep Bilgileri
            </h3>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
              Temel talep detayları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Başlık</Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Talep başlığı"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Talep açıklaması"
              className="min-h-[120px]"
            />
          </div>
          <div>
            <Label>Kategori</Label>
            <ReactSelect
              value={category ? { value: category, label: categoryName || "" } : null}
              onChange={(option: any) => {
                if (option) {
                  onCategoryChange(option.value);
                }
              }}
              options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              isDisabled={isLoadingCategories}
              placeholder="Kategori seçin"
              noOptionsMessage={() => "Kategori bulunamadı"}
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingCategories}
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
          </div>
          <div>
            <Label>Alt Kategori</Label>
            <ReactSelect
              value={subcategory ? { value: subcategory, label: subcategoryName || "" } : null}
              onChange={(option: any) => {
                if (option) {
                  onSubcategoryChange(option.value);
                }
              }}
              options={subcategories.map(subcat => ({ value: subcat.id, label: subcat.name }))}
              isDisabled={!category || isLoadingSubcategories}
              placeholder="Alt kategori seçin"
              noOptionsMessage={() => 
                !category 
                  ? "Önce kategori seçin" 
                  : "Alt kategori bulunamadı"
              }
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingSubcategories}
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
          </div>
          <div>
            <Label>Grup</Label>
            <ReactSelect
              value={group ? { value: group, label: group_name || groupName || "" } : null}
              onChange={(option: any) => {
                if (option) {
                  onGroupChange(option.value);
                }
              }}
              options={groups.map(grp => ({ value: grp.id, label: grp.name }))}
              isDisabled={!subcategory || isLoadingGroups}
              placeholder="Grup seçin"
              noOptionsMessage={() => 
                !subcategory 
                  ? "Önce alt kategori seçin" 
                  : "Grup bulunamadı"
              }
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoadingGroups}
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
          </div>
          <div>
            <Label>Öncelik</Label>
            <ReactSelect
              value={priority ? { 
                value: priority, 
                label: priority === "low" ? "Düşük" : 
                       priority === "medium" ? "Orta" : 
                       priority === "high" ? "Yüksek" : 
                       priority === "urgent" ? "Acil" : "Öncelik seçin"
              } : null}
              onChange={(option: any) => {
                if (option) {
                  onPriorityChange(option.value);
                }
              }}
              options={[
                { value: "low", label: "Düşük" },
                { value: "medium", label: "Orta" },
                { value: "high", label: "Yüksek" },
                { value: "urgent", label: "Acil" }
              ]}
              placeholder="Öncelik seçin"
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Dosya Ekle</Label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  type="button"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md group"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm max-w-[200px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => onFileRemove(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
