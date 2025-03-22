"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "@/types/users"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserFormProps {
    user?: User
    onSubmit: (data: any) => Promise<{ success: boolean; message?: string; details?: string }>
}

export function UserForm({ user, onSubmit }: UserFormProps) {
    const [formData, setFormData] = useState({
        id: user?.id || "",
        name: user?.name || "",
        username: user?.username || "",
        password_hash: user?.password_hash || "",
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
    const [passwordPlaceholder, setPasswordPlaceholder] = useState("")
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)

    // Güncelleme modunda şifre alanı için yıldızlar oluştur
    useEffect(() => {
        if (user) {
            setPasswordPlaceholder("••••••••")
        }
    }, [user])

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

        // API hatası varsa temizle
        if (apiError) {
            setApiError(null)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (validateForm()) {
            setLoading(true)
            setApiError(null)
            
            try {
                const result = await onSubmit(formData)
                
                if (!result.success) {
                    // API hata mesajını işle
                    let errorMessage = result.message || "Bir hata oluştu"
                    
                    // Özel hata mesajları
                    if (result.details?.includes("duplicate key value") && result.details?.includes("users_email_key")) {
                        errorMessage = "Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi giriniz."
                    }
                    
                    setApiError(errorMessage)
                }
            } catch (error) {
                setApiError("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.")
                console.error("Form submit error:", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return <Badge className="bg-red-500">Yönetici</Badge>
            case "manager":
                return <Badge className="bg-blue-500">Müdür</Badge>
            case "agent":
                return <Badge className="bg-green-500">Destek Ekibi</Badge>
            default:
                return <Badge>{role}</Badge>
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {apiError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                </Alert>
            )}
            
            <div className="grid grid-cols-1 gap-6">
                {/* Kişisel Bilgiler */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Kişisel Bilgiler</h3>
                        {formData.role && <div>{getRoleBadge(formData.role)}</div>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Soyad</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="Ad Soyad"
                                disabled={loading}
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
                                disabled={loading}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Departman</Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => handleChange("department", e.target.value)}
                                placeholder="Departman"
                                disabled={loading}
                            />
                            {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="profileImageUrl">Profil Resmi URL</Label>
                            <Input
                                id="profileImageUrl"
                                value={formData.profileImageUrl}
                                onChange={(e) => handleChange("profileImageUrl", e.target.value)}
                                placeholder="/images/avatars/default.png"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Hesap Bilgileri */}
                <div className="space-y-4 pt-2 border-t">
                    <h3 className="text-lg font-medium">Hesap Bilgileri</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password_hash">Parola</Label>
                            <Input
                                id="password_hash"
                                value={formData.password_hash}
                                onChange={(e) => handleChange("password_hash", e.target.value)}
                                placeholder={user ? passwordPlaceholder : "Parola girin"}
                                type="password"
                                disabled={loading}
                            />
                            {user && (
                                <p className="text-xs text-gray-500">Şifreyi değiştirmek istemiyorsanız boş bırakın</p>
                            )}
                            {errors.password_hash && <p className="text-sm text-red-500">{errors.password_hash}</p>}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => handleChange("role", value)}
                                disabled={loading}
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Durum</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleChange("status", value as "active" | "inactive")}
                                disabled={loading}
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
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" className="px-6" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {user ? "Güncelleniyor..." : "Ekleniyor..."}
                        </>
                    ) : (
                        user ? "Güncelle" : "Ekle"
                    )}
                </Button>
            </div>
        </form>
    )
}
