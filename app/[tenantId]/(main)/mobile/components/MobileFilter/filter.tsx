"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDateTimeYMDHI } from "@/lib/utils";
import { toZonedTime } from 'date-fns-tz';
import { format } from "date-fns";
import { tr, enUS, ar, az as azLocale, ru as ruLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, Workflow, ChevronDown, Sun, History, CalendarDays, CalendarRange, Check, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLanguage } from "@/providers/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterStore } from "@/stores/filters-store";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { Efr_Branches } from "@/types/tables";
import { TimePicker } from "@/components/ui/time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSettingsStore } from "@/stores/settings-store";
import { Moon } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { useBranchContext } from "@/providers/branch-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileFilterProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const translations = {
  tr: {
    startDate: "Başlangıç Tarihi",
    endDate: "Bitiş Tarihi",
    allBranches: "Tüm Şubeler",
    branchesSelected: "Şube Seçili",
    searchBranch: "Şube ara...",
    branchNotFound: "Şube bulunamadı.",
    apply: "Uygula",
    dateRange: "Tarih Aralığı",
    today: "Bugün",
    yesterday: "Dün",
    thisWeek: "Bu Hafta",
    lastWeek: "Geçen Hafta",
    thisMonth: "Bu Ay",
    lastMonth: "Geçen Ay",
    functions: "Tarih - Şube Seçimi",
    customDate: "Özel Tarih Seçimi",
    selectAll: "Tümünü Seç"
  },
  en: {
    startDate: "Start Date",
    endDate: "End Date",
    allBranches: "All Branches",
    branchesSelected: "Branches Selected",
    searchBranch: "Search branch...",
    branchNotFound: "Branch not found.",
    apply: "Apply",
    dateRange: "Date Range",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    functions: "Functions",
    customDate: "Custom Date",
    selectAll: "Select All"
  },
  ar: {
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    allBranches: "جميع الفروع",
    branchesSelected: "الفروع المحددة",
    searchBranch: "البحث عن فرع...",
    branchNotFound: "لم يتم العثور على فرع.",
    apply: "تطبيق",
    dateRange: "نطاق التاريخ",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    lastWeek: "الأسبوع الماضي",
    thisMonth: "هذا الشهر",
    lastMonth: "الشهر الماضي",
    functions: "الوظائف",
    customDate: "التاريخ المخصص",
    selectAll: "تحديد الكل"
  },
  az: {
    startDate: "Başlanğıc Tarixi",
    endDate: "Bitmə Tarixi",
    allBranches: "Bütün Filiallar",
    branchesSelected: "Filial Seçildi",
    searchBranch: "Filial axtar...",
    branchNotFound: "Filial tapılmadı.",
    apply: "Tətbiq et",
    refresh: "Yenilə",
    notifications: "Bildirişlər",
    settings: "Parametrlər",
    profile: "Profil",
    time: "Saat",
    dateRange: "Tarix Aralığı",
    today: "Bu gün",
    yesterday: "Dünən",
    thisWeek: "Bu Həftə",
    lastWeek: "Keçən Həftə",
    thisMonth: "Bu Ay",
    lastMonth: "Keçən Ay",
    thisYear: "Bu İl",
    clearSelected: "Seçimləri Təmizlə",
    customRange: "Xüsusi Aralıq",
    cancel: "Ləğv et",
    functions: "Funksiyalar",
    tags: "Etiketlər",
    branches: "Filiallar",
  },
  ru: {
    startDate: "Дата начала",
    endDate: "Дата окончания",
    allBranches: "Все филиалы",
    branchesSelected: "Выбранные филиалы",
    searchBranch: "Поиск филиала...",
    branchNotFound: "Филиал не найден.",
    apply: "Применить",
    refresh: "Обновить",
    notifications: "Уведомления",
    settings: "Настройки",
    profile: "Профиль",
    time: "Время",
    dateRange: "Диапазон дат",
    today: "Сегодня",
    yesterday: "Вчера",
    thisWeek: "Эта неделя",
    lastWeek: "Прошлая неделя",
    thisMonth: "Этот месяц",
    lastMonth: "Прошлый месяц",
    thisYear: "Этот год",
    clearSelected: "Очистить выбранное",
    customRange: "Пользовательский диапазон",
    cancel: "Отмена",
    functions: "Функции",
    tags: "Теги",
    branches: "Филиалы",
  }
};

const locales = {
  tr,
  en: enUS,
  ar,
  az: azLocale,
  ru: ruLocale,
};

const formatDate = (date: Date, language: string) => {
  return format(date, "dd MMM yyyy HH:mm", { locale: locales[language as keyof typeof locales] });
};

export default function MobileFilter({ 
  open: controlledOpen, 
  onOpenChange
}: MobileFilterProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [isBranchSectionOpen, setIsBranchSectionOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const { settings } = useSettingsStore();
  const { selectedFilter, setFilter, handleStartDateSelect, handleEndDateSelect } = useFilterStore();
  const [pendingBranches, setPendingBranches] = useState(selectedFilter.selectedBranches);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(selectedFilter.date.from);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(selectedFilter.date.to);
  const [tempStartTime, setTempStartTime] = useState<string>("00:00");
  const [tempEndTime, setTempEndTime] = useState<string>("23:59");
  const { language, setLanguage } = useLanguage();
  const { setTheme } = useTheme();
  const { countries, selectedCountry, setSelectedCountry } = useBranchContext();
  const t = translations[language as keyof typeof translations];

  const daystart = useMemo(() => parseInt(settings.find(setting => setting.Kod === "daystart")?.Value || '0'), [settings]);

  const { startTime, endTime } = useMemo(() => {
    if (daystart === 0) {
      return { startTime: "00:00", endTime: "23:59" };
    }
    const startHour = daystart.toString().padStart(2, '0');
    const endHour = ((daystart - 1 + 24) % 24).toString().padStart(2, '0');
    return { startTime: `${startHour}:00`, endTime: `${endHour}:59` };
  }, [daystart]);

  const applyFilters = () => {
    if (tempStartDate) {
      const [hours, minutes] = tempStartTime.split(':');
      const newStartDate = new Date(tempStartDate);
      newStartDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      handleStartDateSelect(newStartDate);
    }

    if (tempEndDate) {
      const [hours, minutes] = tempEndTime.split(':');
      const newEndDate = new Date(tempEndDate);
      newEndDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      handleEndDateSelect(newEndDate);
    }

    setFilter({
      ...selectedFilter,
      date: {
        from: toZonedTime(tempStartDate || new Date(), 'Europe/Istanbul'),
        to: toZonedTime(tempEndDate || new Date(), 'Europe/Istanbul')
      },
      selectedBranches: pendingBranches,
    });

    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
  };

  const dateRangeChange = (value: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const today = new Date(new Date().setHours(startHours, startMinutes, 0));
    const tomorrow = addDays(new Date().setHours(endHours, endMinutes, 0), 1);

    switch (value) {
      case "today":
        setTempStartDate(today);
        setTempEndDate(tomorrow);
        setSelectedDateRange("today");
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setTempStartDate(new Date(yesterday.setHours(startHours, startMinutes, 0)));
        setTempEndDate(new Date(today.setHours(endHours, endMinutes, 0)));
        setSelectedDateRange("yesterday");
        break;
      case "thisWeek":
        setTempStartDate(new Date(startOfWeek(today, { weekStartsOn: 1 }).setHours(startHours, startMinutes, 0)));
        setTempEndDate(new Date(endOfWeek(today, { weekStartsOn: 2 }).setHours(endHours, endMinutes, 0)));
        setSelectedDateRange("thisWeek");
        break;
      case "lastWeek":
        const lastWeek = subWeeks(today, 1);
        setTempStartDate(new Date(startOfWeek(lastWeek, { weekStartsOn: 1 }).setHours(startHours, startMinutes, 0)));
        setTempEndDate(new Date(endOfWeek(lastWeek, { weekStartsOn: 2 }).setHours(endHours, endMinutes, 0)));
        setSelectedDateRange("lastWeek");
        break;
      case "thisMonth":
        setTempStartDate(new Date(startOfMonth(today).setHours(startHours, startMinutes, 0)));
        setTempEndDate(addDays(new Date(endOfMonth(today).setHours(endHours, endMinutes, 0)), 1));
        setSelectedDateRange("thisMonth");
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setTempStartDate(new Date(startOfMonth(lastMonth).setHours(startHours, startMinutes, 0)));
        setTempEndDate(addDays(new Date(endOfMonth(lastMonth).setHours(endHours, endMinutes, 0)), 1));
        setSelectedDateRange("lastMonth");
        break;
    }
  };

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md shadow-lg dark:shadow-slate-900/20">
      <div className="flex items-center justify-between h-[4.8rem] px-4 border-b">
        <Button
          variant="outline"
          onClick={() => handleOpenChange(true)}
          className={cn(
            "h-12 px-4 flex-1 max-w-[70%] justify-start bg-background/80 backdrop-blur-sm",
            "shadow-sm hover:shadow-md transition-all duration-300",
            isOpen && "bg-accent"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-base truncate">{t.functions}</span>
          </div>
          {(tempStartDate || tempEndDate || pendingBranches.length > 0) && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
              {(!!tempStartDate ? 1 : 0) + (!!tempEndDate ? 1 : 0) + (pendingBranches.length > 0 ? 1 : 0)}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="text-base font-medium">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("tr")}>
                Türkçe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("az")}>
                Azərbaycan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ru")}>
                Русский
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setLanguage("ar")}>
                العربية
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="w-full h-[100dvh] max-w-none m-0 p-0 gap-0 rounded-none">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle>{t.functions}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 p-4">
            {/* Ülke Seçimi */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span>Ülke Seçimi</span>
              </div>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Ülke Seçin">
                    {countries.find(c => c.name === selectedCountry) && (
                      <div className="flex items-center gap-2">
                        {countries.find(c => c.name === selectedCountry)?.code.startsWith('<svg') ? (
                          <img 
                            src={`data:image/svg+xml;base64,${btoa(countries.find(c => c.name === selectedCountry)?.code || '')}`}
                            alt={selectedCountry}
                            className="w-6 h-4"
                          />
                        ) : (
                          <span className={`fi fi-${countries.find(c => c.name === selectedCountry)?.code} text-base`} />
                        )}
                        <span>{selectedCountry}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      <div className="flex items-center gap-2">
                        {country.code.startsWith('<svg') ? (
                          <img 
                            src={`data:image/svg+xml;base64,${btoa(country.code)}`}
                            alt={country.name}
                            className="w-6 h-4"
                          />
                        ) : (
                          <span className={`fi fi-${country.code} text-base`} />
                        )}
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarih Aralığı */}
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5" />
              <span>{t.dateRange}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "today"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("today")}
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-base">{t.today}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "yesterday"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("yesterday")}
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="text-base">{t.yesterday}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "thisWeek"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("thisWeek")}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-base">{t.thisWeek}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "lastWeek"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("lastWeek")}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-base">{t.lastWeek}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "thisMonth"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("thisMonth")}
              >
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  <span className="text-base">{t.thisMonth}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 border-gray-200 dark:border-gray-800",
                  selectedDateRange === "lastMonth"
                    ? "!border-blue-500 !bg-blue-50 hover:!bg-blue-100 dark:!bg-blue-950 dark:hover:!bg-blue-900 font-medium"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                )}
                onClick={() => dateRangeChange("lastMonth")}
              >
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  <span className="text-base">{t.lastMonth}</span>
                </div>
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
              className="w-full flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="text-lg font-medium">{t.customDate}</span>
              </div>
              <ChevronDown className={cn("h-5 w-5 transition-transform", isCustomDateOpen && "rotate-180")} />
            </Button>

            <div className={cn("grid gap-6 transition-all", !isCustomDateOpen && "hidden")}>
              <div className="space-y-3">
                <label className="text-base font-medium text-muted-foreground">{t.startDate}</label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-start text-left font-normal text-base">
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {tempStartDate ? (
                          formatDate(tempStartDate, language)
                        ) : (
                          <span>{t.startDate}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tempStartDate}
                        onSelect={(date) => {
                          if (date) {
                            const [hours, minutes] = tempStartTime.split(':');
                            const newDate = new Date(date);
                            newDate.setHours(parseInt(hours), parseInt(minutes), 0);
                            setTempStartDate(newDate);
                          }
                        }}
                        disabled={(date) => tempEndDate ? date > tempEndDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimePicker
                    value={tempStartTime}
                    onChange={(value) => {
                      setTempStartTime(value);
                      if (tempStartDate) {
                        const [hours, minutes] = value.split(':');
                        const newDate = new Date(tempStartDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes), 0);
                        setTempStartDate(newDate);
                      }
                    }}
                    className="w-[120px] h-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-base font-medium text-muted-foreground">{t.endDate}</label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-start text-left font-normal text-base">
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {tempEndDate ? (
                          formatDate(tempEndDate, language)
                        ) : (
                          <span>{t.endDate}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tempEndDate}
                        onSelect={(date) => {
                          if (date) {
                            const [hours, minutes] = tempEndTime.split(':');
                            const newDate = new Date(date);
                            newDate.setHours(parseInt(hours), parseInt(minutes), 0);
                            setTempEndDate(newDate);
                          }
                        }}
                        disabled={(date) => tempStartDate ? date < tempStartDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimePicker
                    value={tempEndTime}
                    onChange={(value) => {
                      setTempEndTime(value);
                      if (tempEndDate) {
                        const [hours, minutes] = value.split(':');
                        const newDate = new Date(tempEndDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes), 0);
                        setTempEndDate(newDate);
                      }
                    }}
                    className="w-[120px] h-12"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setIsBranchSectionOpen(!isBranchSectionOpen)}
              className="w-full flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                <span className="text-lg font-medium">{t.allBranches}</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingBranches.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {pendingBranches.length} {t.branchesSelected}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingBranches(pendingBranches.length === selectedFilter.branches.length ? [] : selectedFilter.branches);
                  }}
                >
                  <Check className={cn(
                    "h-4 w-4 transition-colors",
                    pendingBranches.length === selectedFilter.branches.length ? "text-blue-500" : "text-muted-foreground"
                  )} />
                </Button>
                <ChevronDown className={cn("h-5 w-5 transition-transform", isBranchSectionOpen && "rotate-180")} />
              </div>
            </Button>

            <div className={cn("space-y-4", !isBranchSectionOpen && "hidden")}>
              <Command className="rounded-lg border shadow-md overflow-hidden">
                <CommandInput 
                  placeholder={t.searchBranch} 
                  className="h-11 text-base command-input"
                />
                <CommandList className="max-h-[200px] overflow-y-auto">
                  <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                    {t.branchNotFound}
                  </CommandEmpty>
                  <CommandGroup>
                    {selectedFilter.branches.map((branch: Efr_Branches) => (
                      <CommandItem
                        key={branch.BranchID}
                        onSelect={() => {
                          setPendingBranches(prev => {
                            const isSelected = prev.some(b => b.BranchID === branch.BranchID);
                            return isSelected
                              ? prev.filter(b => b.BranchID !== branch.BranchID)
                              : [...prev, branch];
                          });
                        }}
                        className="h-11 px-2"
                      >
                        <Checkbox
                          checked={pendingBranches.some(b => b.BranchID === branch.BranchID)}
                          className="mr-2"
                        />
                        <span className="text-base">{branch.BranchName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>

          <div className="border-t p-4 mt-auto mb-10">
            <Button onClick={applyFilters} className="w-full h-12 bg-blue-200 hover:bg-blue-300 text-gray-900 text-base font-medium">
              {t.apply}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
