import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

type Option = {
  value: string
  label: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  className,
  disabled = false,
  placeholder = "Seçim yapınız",
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  )

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = options.length > 0 && selected.length === options.length

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(options.map(option => option.value))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedOptions.length > 0 ? (
              <>
                {selectedOptions.length <= 3 ? (
                  selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="mr-1"
                    >
                      {option.label}
                      {!disabled && (
                        <button
                          className="ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onChange(selected.filter((value) => value !== option.value))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span>{selectedOptions.length} öğe seçildi</span>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2 border-b">
          <div className="flex items-center space-x-2 pb-2">
            <Checkbox 
              id="select-all" 
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label 
              htmlFor="select-all" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Tümünü Seç
            </label>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="h-60">
          <div className="space-y-1 p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected.includes(option.value) && "bg-accent"
                  )}
                  onClick={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((value) => value !== option.value)
                        : [...selected, option.value]
                    )
                  }}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    className="mr-2 h-4 w-4"
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selected, option.value])
                      } else {
                        onChange(selected.filter(value => value !== option.value))
                      }
                    }}
                  />
                  {option.label}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
