"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Users, Loader2, CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUsers } from "@/providers/users-provider"
import ReactSelect from "react-select"

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
  // UsersProvider'dan kullanıcıları al
  const { users, isLoading, error } = useUsers();

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
            <ReactSelect
              value={assignedTo ? { 
                value: assignedTo, 
                label: users.find(user => user.id === assignedTo)?.name || "Kişi seçin" 
              } : { value: "", label: "Atanmadı" }}
              onChange={(option: any) => {
                onAssignedToChange(option?.value || "");
              }}
              options={[
                { value: "", label: "Atanmadı" },
                ...users.map(user => ({
                  value: user.id,
                  label: user.name
                }))
              ]}
              isDisabled={isLoading}
              placeholder="Kişi seçin"
              noOptionsMessage={() => error || "Kullanıcı bulunamadı"}
              loadingMessage={() => "Yükleniyor..."}
              isLoading={isLoading}
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
              components={{
                LoadingIndicator: () => (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )
              }}
            />
          </div>
          <div>
            <Label>Kaynak</Label>
            <ReactSelect
              value={source ? {
                value: source,
                label: source === "email" ? "E-posta" :
                       source === "phone" ? "Telefon" :
                       source === "web" ? "Web Sitesi" :
                       source === "chat" ? "Canlı Destek" : "Kaynak seçin"
              } : null}
              onChange={(option: any) => {
                onSourceChange(option?.value || "");
              }}
              options={[
                { value: "email", label: "E-posta" },
                { value: "phone", label: "Telefon" },
                { value: "web", label: "Web Sitesi" },
                { value: "chat", label: "Canlı Destek" }
              ]}
              placeholder="Kaynak seçin"
              isClearable
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
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
            <ReactSelect
              value={{
                value: slaBreach ? "true" : "false",
                label: slaBreach ? "Evet" : "Hayır"
              }}
              onChange={(option: any) => {
                onSlaBreachChange(option?.value === "true");
              }}
              options={[
                { value: "false", label: "Hayır" },
                { value: "true", label: "Evet" }
              ]}
              classNames={{
                control: (state) => 
                  `border rounded-md p-1 bg-background ${state.isFocused ? 'border-primary ring-1 ring-primary' : 'border-input'}`,
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                option: (state) => 
                  `${state.isFocused ? 'bg-accent' : 'bg-background'} ${state.isSelected ? 'bg-primary text-primary-foreground' : ''}`,
                menu: () => "bg-background border rounded-md shadow-md mt-1 z-50",
              }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
