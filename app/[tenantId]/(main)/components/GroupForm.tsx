"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Group } from "@/types/categories"
import { Checkbox } from "@/components/ui/checkbox"
import { getUserId } from "@/utils/user-utils"

interface GroupFormProps {
    group?: Group
    onSubmit: (data: Partial<Group> & { userId?: string | null }) => void
}

function GroupForm({ group, onSubmit }: GroupFormProps) {
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        subcategoryId: "",
        mesaiSaatleriSla: 60,
        mesaiDisiSla: 120,
        haftaSonuMesaiSla: 180,
        haftaSonuMesaiDisiSla: 240,
        slaNextDayStart: false
    })

    useEffect(() => {
        if (group) {
            setFormData({
                id: group.id,
                name: group.name,
                description: group.description || "",
                subcategoryId: group.subcategoryId,
                mesaiSaatleriSla: group.mesaiSaatleriSla || 60,
                mesaiDisiSla: group.mesaiDisiSla || 120,
                haftaSonuMesaiSla: group.haftaSonuMesaiSla || 180,
                haftaSonuMesaiDisiSla: group.haftaSonuMesaiDisiSla || 240,
                slaNextDayStart: group.slaNextDayStart || false
            })
        }
    }, [group])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ 
            ...prev, 
            [name]: name.includes('sla') && !name.includes('NextDayStart') ? parseInt(value) || 0 : value 
        }))
    }

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            slaNextDayStart: checked
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const userId = getUserId()
        onSubmit({ ...formData, userId })
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="mesaiSaatleriSla">
                        Mesai Saatleri SLA (dakika)
                    </Label>
                    <Input
                        id="mesaiSaatleriSla"
                        name="mesaiSaatleriSla"
                        type="number"
                        min="1"
                        placeholder="60"
                        value={formData.mesaiSaatleriSla}
                        onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Mesai saatleri içinde çözülmesi gereken süre (dakika)</p>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="mesaiDisiSla">
                        Mesai Dışı SLA (dakika)
                    </Label>
                    <Input
                        id="mesaiDisiSla"
                        name="mesaiDisiSla"
                        type="number"
                        min="1"
                        placeholder="120"
                        value={formData.mesaiDisiSla}
                        onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Mesai saatleri dışında çözülmesi gereken süre (dakika)</p>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="haftaSonuMesaiSla">
                        Hafta Sonu Mesai SLA (dakika)
                    </Label>
                    <Input
                        id="haftaSonuMesaiSla"
                        name="haftaSonuMesaiSla"
                        type="number"
                        min="1"
                        placeholder="180"
                        value={formData.haftaSonuMesaiSla}
                        onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Hafta sonu mesai saatleri içinde çözülmesi gereken süre (dakika)</p>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="haftaSonuMesaiDisiSla">
                        Hafta Sonu Mesai Dışı SLA (dakika)
                    </Label>
                    <Input
                        id="haftaSonuMesaiDisiSla"
                        name="haftaSonuMesaiDisiSla"
                        type="number"
                        min="1"
                        placeholder="240"
                        value={formData.haftaSonuMesaiDisiSla}
                        onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Hafta sonu mesai saatleri dışında çözülmesi gereken süre (dakika)</p>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="slaNextDayStart" 
                    checked={formData.slaNextDayStart}
                    onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="slaNextDayStart" className="font-normal cursor-pointer">
                    SLA sonraki gün başlar
                </Label>
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
