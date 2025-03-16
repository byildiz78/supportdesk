"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/types/users"

interface UserFormProps {
    user?: User
    onSubmit: (data: any) => void
}

export function UserForm({ user, onSubmit }: UserFormProps) {
    const [formData, setFormData] = useState({
        id: user?.id || "",
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "agent",
        department: user?.department || "",
        status: user?.status || "active",
        lastLogin: user?.lastLogin || "",
        createdAt: user?.createdAt || "",
        profileImageUrl: user?.profileImageUrl || "",
        createdBy: user?.createdBy || "",
        updatedAt: user?.updatedAt || "",
        updatedBy: user?.updatedBy || "",
        flowID: user?.flowID || "",
        isDeleted: user?.isDeleted || false
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        
        // Clear error when field is edited
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        
        if (!formData.name.trim()) {
            newErrors.name = "Ad Soyad alanı zorunludur"
        }
        
        if (!formData.email.trim()) {
            newErrors.email = "E-posta alanı zorunludur"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Geçerli bir e-posta adresi giriniz"
        }
        
        if (!formData.department?.trim()) {
            newErrors.department = "Departman alanı zorunludur"
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (validateForm()) {
            onSubmit(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Ad Soyad"
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="ornek@firma.com"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="profileImageUrl">Profil Resmi URL</Label>
                    <Input
                        id="profileImageUrl"
                        value={formData.profileImageUrl}
                        onChange={(e) => handleChange("profileImageUrl", e.target.value)}
                        placeholder="/images/avatars/default.png"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                        value={formData.role}
                        onValueChange={(value) => handleChange("role", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Yönetici</SelectItem>
                            <SelectItem value="manager">Müdür</SelectItem>
                            <SelectItem value="agent">Destek Ekibi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="department">Departman</Label>
                    <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                        placeholder="Departman"
                    />
                    {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange("status", value as "active" | "inactive")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Pasif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="flowID">Flow ID</Label>
                    <Input
                        id="flowID"
                        value={formData.flowID}
                        onChange={(e) => handleChange("flowID", e.target.value)}
                        placeholder="flow-xxx"
                    />
                </div>
            </div>
            
            <div className="flex justify-end gap-2">
                <Button type="submit">
                    {user ? "Güncelle" : "Ekle"}
                </Button>
            </div>
        </form>
    )
}
