"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Subcategory } from "@/types/categories"
import { getUserId } from "@/utils/user-utils"

interface SubcategoryFormProps {
    subcategory?: Subcategory
    onSubmit: (data: Partial<Subcategory> & { userId?: string | null }) => void
}

function SubcategoryForm({ subcategory, onSubmit }: SubcategoryFormProps) {
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        categoryId: ""
    })

    useEffect(() => {
        if (subcategory) {
            setFormData({
                id: subcategory.id,
                name: subcategory.name,
                description: subcategory.description || "",
                categoryId: subcategory.categoryId
            })
        }
    }, [subcategory])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const userId = getUserId()
        onSubmit({ ...formData, userId })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Alt Kategori Adı</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Alt kategori adını girin"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Alt kategori açıklamasını girin"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    {subcategory ? "Güncelle" : "Ekle"}
                </Button>
            </div>
        </form>
    )
}

export default SubcategoryForm
