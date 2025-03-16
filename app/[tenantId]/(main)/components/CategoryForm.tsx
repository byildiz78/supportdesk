"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Category } from "@/types/categories"

interface CategoryFormProps {
    category?: Category
    onSubmit: (data: Partial<Category>) => void
}

function CategoryForm({ category, onSubmit }: CategoryFormProps) {
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: ""
    })

    useEffect(() => {
        if (category) {
            setFormData({
                id: category.id,
                name: category.name,
                description: category.description || ""
            })
        }
    }, [category])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Kategori Adı</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Kategori adını girin"
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
                    placeholder="Kategori açıklamasını girin"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    {category ? "Güncelle" : "Ekle"}
                </Button>
            </div>
        </form>
    )
}

export default CategoryForm
