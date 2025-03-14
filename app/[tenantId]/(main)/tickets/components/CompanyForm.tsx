"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Building2 } from "lucide-react"

interface CompanyFormProps {
  parentCompanyId: string
  companyId: string
  companyName: string
  onCompanyIdChange: (value: string) => void
  onCompanyNameChange: (value: string) => void
}

export default function CompanyForm({
  parentCompanyId,
  companyId,
  companyName,
  onCompanyIdChange,
  onCompanyNameChange
}: CompanyFormProps) {
  // Mock companies data - in a real app, you would fetch these based on the parentCompanyId
  const companiesByParent: Record<string, Array<{id: string, name: string}>> = {
    "pc1": [
      { id: "c1", name: "Firma A1" },
      { id: "c2", name: "Firma A2" }
    ],
    "pc2": [
      { id: "c3", name: "Firma B1" },
      { id: "c4", name: "Firma B2" }
    ],
    "pc3": [
      { id: "c5", name: "Firma C1" },
      { id: "c6", name: "Firma C2" }
    ],
    "": [
      { id: "c7", name: "Bağımsız Firma 1" },
      { id: "c8", name: "Bağımsız Firma 2" }
    ]
  }

  const companies = parentCompanyId ? companiesByParent[parentCompanyId] || [] : companiesByParent[""]

  const handleCompanySelect = (id: string) => {
    onCompanyIdChange(id)
    const company = companies.find(c => c.id === id)
    if (company) {
      onCompanyNameChange(company.name)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
              Firma Bilgileri
            </h3>
            <p className="text-sm text-green-600/80 dark:text-green-400/80">
              Firma detayları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Firma</Label>
            <Select
              value={companyId}
              onValueChange={handleCompanySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Firma seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seçiniz</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {companyId && (
            <div className="md:col-span-2">
              <Label>Firma Adı</Label>
              <Input
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                placeholder="Firma adı"
                disabled
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
