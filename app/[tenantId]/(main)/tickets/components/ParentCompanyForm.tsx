"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Building2 } from "lucide-react"

interface ParentCompanyFormProps {
  parentCompanyId: string
  parentCompanyName: string
  onParentCompanyIdChange: (value: string) => void
  onParentCompanyNameChange: (value: string) => void
}

export default function ParentCompanyForm({
  parentCompanyId,
  parentCompanyName,
  onParentCompanyIdChange,
  onParentCompanyNameChange
}: ParentCompanyFormProps) {
  // Normally, you would fetch these from an API
  const parentCompanies = [
    { id: "pc1", name: "Ana Firma A" },
    { id: "pc2", name: "Ana Firma B" },
    { id: "pc3", name: "Ana Firma C" }
  ]

  const handleParentCompanySelect = (id: string) => {
    onParentCompanyIdChange(id)
    const company = parentCompanies.find(c => c.id === id)
    if (company) {
      onParentCompanyNameChange(company.name)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              Ana Firma Bilgileri
            </h3>
            <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">
              Ana firma detayları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Ana Firma</Label>
            <Select
              value={parentCompanyId}
              onValueChange={handleParentCompanySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ana firma seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seçiniz</SelectItem>
                {parentCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {parentCompanyId && (
            <div className="md:col-span-2">
              <Label>Ana Firma Adı</Label>
              <Input
                value={parentCompanyName}
                onChange={(e) => onParentCompanyNameChange(e.target.value)}
                placeholder="Ana firma adı"
                disabled
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
