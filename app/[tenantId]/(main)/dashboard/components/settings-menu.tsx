"use client";

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams } from 'next/navigation';

interface SettingsMenuProps {
  settings: {
    minDiscountAmount: number | null;
    minCancelAmount: number | null;
    minSaleAmount: number | null;
  } | null;
  onSettingsChange: (newSettings: any) => void;
  onSave: (settings: any) => Promise<void>;
  loading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsMenu({ 
  settings, 
  onSettingsChange, 
  onSave, 
  loading = false,
  isOpen,
  onOpenChange 
}: SettingsMenuProps) {
  const params = useParams();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      await onSave(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Bildirim Ayarları</h4>
            <p className="text-sm text-muted-foreground">
              Minimum bildirim limitlerini ayarlayın
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="minDiscountAmount">Min İndirim</Label>
              <Input
                id="minDiscountAmount"
                type="number"
                className="col-span-2"
                value={settings.minDiscountAmount ?? ''}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    minDiscountAmount: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Limit yok"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="minCancelAmount">Min İptal</Label>
              <Input
                id="minCancelAmount"
                type="number"
                className="col-span-2"
                value={settings.minCancelAmount ?? ''}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    minCancelAmount: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Limit yok"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="minSaleAmount">Min Satış</Label>
              <Input
                id="minSaleAmount"
                type="number"
                className="col-span-2"
                value={settings.minSaleAmount ?? ''}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    minSaleAmount: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Limit yok"
              />
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading || isSaving} 
            className="w-full mt-2"
          >
            {(loading || isSaving) ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
