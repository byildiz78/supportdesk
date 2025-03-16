"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function Combobox({
  options = [],
  value = "",
  onChange,
  placeholder = "Seçiniz",
  emptyMessage = "Sonuç bulunamadı.",
  searchPlaceholder = "Ara...",
  disabled = false,
  className,
}: ComboboxProps) {
  console.log("Combobox rendered with options:", options);
  console.log("Combobox value:", value);
  console.log("Combobox options type:", typeof options);
  console.log("Is options an array:", Array.isArray(options));
  
  const [open, setOpen] = React.useState(false)
  
  // Ensure options is always an array of valid objects
  const safeOptions = React.useMemo(() => {
    console.log("Computing safeOptions from:", options);
    
    if (!options) {
      console.log("Options is falsy:", options);
      return [];
    }
    
    if (!Array.isArray(options)) {
      console.log("Options is not an array:", options);
      return [];
    }
    
    // Filter out any invalid options and ensure each option has valid properties
    const filteredOptions = options.filter(option => {
      const isValid = option && 
                     typeof option === 'object' && 
                     'value' in option && 
                     'label' in option;
      
      if (!isValid) {
        console.log("Invalid option found:", option);
      }
      
      return isValid;
    });
    
    console.log("Filtered options:", filteredOptions);
    
    const mappedOptions = filteredOptions.map(option => {
      const result = {
        value: option.value || "",
        label: option.label || ""
      };
      return result;
    });
    
    console.log("Final safeOptions:", mappedOptions);
    return mappedOptions;
  }, [options]);
  
  // Find the selected option safely
  const selectedOption = React.useMemo(() => {
    console.log("Finding selectedOption with value:", value);
    console.log("safeOptions length:", safeOptions.length);
    
    if (!value || value === "") {
      console.log("Value is empty or undefined");
      return undefined;
    }
    
    if (safeOptions.length === 0) {
      console.log("No options available");
      return undefined;
    }
    
    const found = safeOptions.find((option) => option.value === value);
    console.log("Selected option found:", found);
    return found;
  }, [safeOptions, value]);

  // Handle errors safely
  const handleSelect = React.useCallback((selectedValue: string) => {
    console.log("handleSelect called with:", selectedValue);
    try {
      onChange(selectedValue === value ? "" : selectedValue);
      console.log("onChange completed successfully");
    } catch (error) {
      console.error("Error in combobox selection:", error);
    }
    setOpen(false);
  }, [onChange, value, setOpen]);

  // Log when popover state changes
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    console.log("Popover open state changing to:", isOpen);
    try {
      setOpen(isOpen);
      console.log("Popover state changed successfully");
    } catch (error) {
      console.error("Error changing popover state:", error);
    }
  }, [setOpen]);

  // Simple rendering without complex nested functions
  return (
    <div className="relative w-full">
      {/* Use a simple button instead of Popover for debugging */}
      <Button
        variant="outline"
        role="combobox"
        className={cn("w-full justify-between", className)}
        disabled={disabled}
        onClick={() => {
          console.log("Button clicked, current open state:", open);
          handleOpenChange(!open);
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {/* Only render dropdown content if open */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover p-0 shadow-md">
          <div className="flex items-center border-b px-3">
            <input 
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
            />
          </div>
          
          {safeOptions.length > 0 ? (
            <div className="max-h-[200px] overflow-auto p-1">
              {safeOptions.map((option, index) => {
                console.log("Rendering option:", option, "at index:", index);
                return (
                  <div
                    key={`${option.value || "empty"}-${index}`}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      console.log("Option clicked:", option);
                      handleSelect(option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label || ""}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-sm">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
