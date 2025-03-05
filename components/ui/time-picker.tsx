"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number)

  const handleHourChange = (hour: string) => {
    onChange(`${hour.padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }

  const handleMinuteChange = (minute: string) => {
    onChange(`${hours.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`)
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center space-x-1">
        <Select value={hours.toString()} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[3.5rem] h-8 px-2 bg-background/60 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent className="h-[200px] overflow-y-auto bg-background/95 backdrop-blur-md border-border/50 shadow-xl">
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minutes.toString()} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-[3.5rem] h-8 px-2 bg-background/60 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent className="h-[200px] overflow-y-auto bg-background/95 backdrop-blur-md border-border/50 shadow-xl">
            {Array.from({ length: 60 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
