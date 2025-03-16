"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Users, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserService } from "../../users/services/user-service"
import { User } from "@/types/users"

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
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from the database
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      setError(null)
      try {
        const usersData = await UserService.getUsers()
        setUsers(usersData)
      } catch (error: any) {
        console.error("Kullanıcılar alınırken hata oluştu:", error)
        setError(error.message || "Kullanıcılar alınamadı")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

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
                {isLoadingUsers ? (
                  <SelectItem value="" disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </SelectItem>
                ) : error ? (
                  <SelectItem value="" disabled>
                    {error}
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="" disabled>
                    Kullanıcı bulunamadı
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                )}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(new Date(dueDate), "PPP", { locale: tr }) : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <ReactDatePicker
                  selected={dueDate ? new Date(dueDate) : null}
                  onChange={(date) => onDueDateChange(date ? date.toISOString() : null)}
                  dateFormat="dd/MM/yyyy"
                  locale={tr}
                  inline
                />
              </PopoverContent>
            </Popover>
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
