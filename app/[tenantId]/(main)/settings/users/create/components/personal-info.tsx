'use client';

import { User, Mail, Phone, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react"
import { Efr_Users } from "@/pages/api/settings/users/types";
import { Efr_Branches } from "@/types/tables";
import { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface FormData {
  Name: string;
  SurName: string;
  EMail: string;
  PhoneNumber: string;
  Schema: string;
  UserBranchs?: string;
  UserName: string;
  Category?: number;
  IsActive?: boolean;
}

interface PersonalInfoProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  branches: Efr_Branches[];
}

export function PersonalInfo({ formData, setFormData, branches }: PersonalInfoProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Kullanıcının şubelerini başlangıçta seçili hale getir
  // Schema veya UserBranchs değerlerinden birini kullan
  const initialSelectedBranches = useMemo(() => {
    // Önce UserBranchs'i kontrol et, yoksa Schema'yı kullan
    const branchString = formData.UserBranchs || formData.Schema || "";
    return branchString ? branchString.split(",") : [];
  }, [formData.UserBranchs, formData.Schema]);
  
  const [selectedBranches, setSelectedBranches] = useState<string[]>(initialSelectedBranches);

  // Başlangıçta seçili şubeleri formData'ya ekle
  useEffect(() => {
    if (initialSelectedBranches.length > 0) {
      // Eğer UserBranchs yoksa ama Schema varsa, Schema'yı UserBranchs'e kopyala
      if (!formData.UserBranchs && formData.Schema) {
        setFormData({
          ...formData,
          UserBranchs: formData.Schema
        });
      }
    }
  }, []);

  const filteredBranches = branches.filter(
    (branch) =>
      branch?.BranchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch?.ExternalCode && branch.ExternalCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (branch?.Region && branch.Region.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Şube ismi veya ID'sine göre seçili olup olmadığını kontrol et
  const isBranchSelected = (branch: Efr_Branches) => {
    return selectedBranches.some(selected => 
      selected === branch.BranchID.toString() || 
      selected === branch.BranchName ||
      (branch.ExternalCode && selected === branch.ExternalCode)
    );
  };

  const toggleBranch = (branchId: string | number, branchName: string) => {
    // Şube ID veya ismine göre seçili olup olmadığını kontrol et
    const isSelected = selectedBranches.some(selected => 
      selected === branchId.toString() || 
      selected === branchName
    );
    
    // Eğer seçiliyse kaldır, değilse ekle
    const newSelectedBranches = isSelected
      ? selectedBranches.filter(selected => selected !== branchId.toString() && selected !== branchName)
      : [...selectedBranches, branchName]; // Şube ismi kullan

    setSelectedBranches(newSelectedBranches);
    setFormData({
      ...formData,
      UserBranchs: newSelectedBranches.join(","),
      Schema: newSelectedBranches.join(",") // Schema'yı da güncelle
    });
  };

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ad"
                  value={formData.Name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Soyisim</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Soyisim"
                  value={formData.SurName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, SurName: e.target.value })
                  }
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Telefon numarası"
                  value={formData.PhoneNumber || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, PhoneNumber: e.target.value })
                  }
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">E-Posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.EMail || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, EMail: e.target.value })
                  }
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Kullanıcı Adı</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı adı"
                  value={formData.UserName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, UserName: e.target.value })
                  }
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Şema</Label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200 w-full justify-between"
                    >
                      {selectedBranches.length > 0 ? 
                        `${selectedBranches.length} Firma Seçili` 
                        : "Firma seçiniz"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Firma ara..." 
                        className="h-9"
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandEmpty>Firma bulunamadı.</CommandEmpty>
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandGroup>
                          {Array.isArray(filteredBranches) && filteredBranches.length > 0 ? filteredBranches.map((branch) => (
                            <CommandItem
                              key={branch.BranchID}
                              onSelect={() => toggleBranch(branch.BranchID, branch.BranchName)}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent/50"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isBranchSelected(branch)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span>{branch.BranchName}</span>
                            </CommandItem>
                          )) : <CommandItem>Firma bulunamadı</CommandItem>}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Kategori</Label>
            <Select
              defaultValue="1"
              value={formData.Category ? formData.Category.toString() : "1"}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  Category: Number(value)
                });
              }}
            >
              <SelectTrigger className="bg-background/50 border-border/50 focus:ring-primary/20 transition-all duration-200">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Standart</SelectItem>
                <SelectItem value="2">Çoklu Şube</SelectItem>
                <SelectItem value="3">Bölge Sorumlusu</SelectItem>
                <SelectItem value="4">Yönetici</SelectItem>
                <SelectItem value="5">Süper Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 mt-8">
            <Switch
              id="active"
              checked={formData.IsActive || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, IsActive: checked })
              }
            />
            <Label htmlFor="active" className="text-sm font-medium">
              Aktif Kullanıcı
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
