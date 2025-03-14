"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Group } from "@/types/categories"

interface GroupFormProps {
    group?: Group
    onSubmit: (data: Partial<Group>) => void
}

function GroupForm({ group, onSubmit }: GroupFormProps) {
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: ""
    })

    useEffect(() => {
        if (group) {
            setFormData({
                id: group.id,
                name: group.name,
                description: group.description || "",
                subcategoryId: group.subcategoryId
            })
        }
    }, [group])

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
                <Label htmlFor="name">Grup Adı</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Grup adını girin"
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
                    placeholder="Grup açıklamasını girin"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    {group ? "Güncelle" : "Ekle"}
                </Button>
            </div>
        </form>
    )
}

export default GroupForm
