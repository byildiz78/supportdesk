"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"

interface AssignmentFormProps {
  assignedTo: string
  source: string
  dueDate: string | null
  slaBreach: boolean
  onAssignedToChange: (value: string) => void
  onSourceChange: (value: string) => void
  onDueDateChange: (value: string | null) => void
  onSlaBreachChange: (value: boolean) => void
}

export default function AssignmentForm({
  assignedTo,
  source,
  dueDate,
  slaBreach,
  onAssignedToChange,
  onSourceChange,
  onDueDateChange,
  onSlaBreachChange
}: AssignmentFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
              Atama Bilgileri
            </h3>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
              Talebin atanacağı kişi ve diğer bilgiler
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Atanan Kişi</Label>
            <Select
              value={assignedTo}
              onValueChange={onAssignedToChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kişi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Atanmadı</SelectItem>
                <SelectItem value="agent1">Destek Uzmanı 1</SelectItem>
                <SelectItem value="agent2">Destek Uzmanı 2</SelectItem>
                <SelectItem value="agent3">Destek Uzmanı 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kaynak</Label>
            <Select
              value={source}
              onValueChange={onSourceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kaynak seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-posta</SelectItem>
                <SelectItem value="phone">Telefon</SelectItem>
                <SelectItem value="web">Web Sitesi</SelectItem>
                <SelectItem value="chat">Canlı Destek</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Son Tarih</Label>
            <DatePicker 
              date={dueDate ? new Date(dueDate) : null} 
              setDate={(date) => onDueDateChange(date ? date.toISOString() : null)} 
              className="w-full"
            />
          </div>
          <div>
            <Label>SLA İhlali</Label>
            <Select
              value={slaBreach ? "true" : "false"}
              onValueChange={(value) => onSlaBreachChange(value === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Hayır</SelectItem>
                <SelectItem value="true">Evet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
