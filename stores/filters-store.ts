import { create } from 'zustand'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, addDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Efr_Branches } from '@/types/tables'
import { useSettingsStore } from './settings-store'
import { useTabStore } from './tab-store'
import { toZonedTime } from 'date-fns-tz';
import { Efr_Tags } from '@/pages/api/settings/efr_tag/types'

interface FilterState {
  date: {
    from?: Date;
    to?: Date;
  };
  branches: Efr_Branches[];
  tags: Efr_Tags[];
  selectedBranches: Efr_Branches[];
  selectedTags: Efr_Tags[];
  appliedAt?: number;
  selectedDateRange?: string;
}

interface FilterStore {
  selectedFilter: FilterState
  setFilter: (filter: FilterState) => void
  setBranchs: (branchs: Efr_Branches[]) => void
  setTags: (tags: Efr_Tags[]) => void
  setToDefaultFilters: () => void
  addBranch: (branch: Efr_Branches) => void
  handleDateRangeChange: (value: string) => void
  handleStartDateSelect: (date: Date | undefined) => void
  handleEndDateSelect: (date: Date | undefined) => void
  handleTagSelect: (tag: Efr_Tags) => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedFilter: {
    date: {
      from: toZonedTime(new Date(new Date().setHours(0, 0, 0, 0)), 'Europe/Istanbul'),
      to: toZonedTime(new Date().setHours(23, 59, 59, 999), 'Europe/Istanbul'),
    },
    branches: [],
    tags: [],
    selectedBranches: [],
    selectedTags: [],
    appliedAt: undefined
  },

  setFilter: (filter: FilterState) =>
    set((state) => {
      // Önce mevcut filtrenin ve gelen filtrenin derin bir kopyasını oluşturalım
      const currentFilter = JSON.parse(JSON.stringify(state.selectedFilter));
      const incomingFilter = JSON.parse(JSON.stringify(filter));

      // Tarihleri kontrol edelim ve gelen tarihler varsa onları kullanalım
      const safeDate = {
        from: incomingFilter.date?.from
          ? new Date(incomingFilter.date.from)
          : currentFilter.date?.from
            ? new Date(currentFilter.date.from)
            : toZonedTime(new Date(new Date().setHours(0, 0, 0, 0)), 'Europe/Istanbul'),
        to: incomingFilter.date?.to
          ? new Date(incomingFilter.date.to)
          : currentFilter.date?.to
            ? new Date(currentFilter.date.to)
            : toZonedTime(new Date().setHours(23, 59, 59, 999), 'Europe/Istanbul')
      };

      // Tüm seçili tag'lerin branch'larını birleştir
      const allBranchIDs = incomingFilter.selectedTags?.reduce((ids: string[], tag) => {
        return [...ids, ...tag.BranchID];
      }, []) || [];

      let effectiveBranches = incomingFilter.selectedTags?.length > 0
        ? incomingFilter.selectedBranches.filter(branch =>
          allBranchIDs.includes(branch.BranchID)
        )
        : incomingFilter.selectedBranches;
        
      // Eğer seçili şube yoksa ve şube listesi doluysa, ilk şubeyi seç
      if (effectiveBranches.length === 0 && incomingFilter.branches.length > 0) {
        effectiveBranches = [incomingFilter.branches[0]];
      }

      // Mevcut tab'ın filter'ını al
      const activeTab = useTabStore.getState().activeTab;
      const currentTabFilter = useTabStore.getState().getTabFilter(activeTab);

      // Yeni filtre nesnesini oluşturalım, tarihleri daima koruyarak
      const newFilter = {
        ...incomingFilter,
        date: safeDate, // Tarihler daima korunur
        selectedBranches: effectiveBranches,
        selectedTags: incomingFilter.selectedTags || currentFilter.selectedTags,
        tags: incomingFilter.tags || currentFilter.tags,
        appliedAt: Date.now(),
        selectedDateRange: currentTabFilter?.selectedDateRange || 'today'
      };

      // Tab store'u güncelle
      if (activeTab) {
        useTabStore.getState().setTabFilter(activeTab, newFilter);
      }


      return {
        selectedFilter: newFilter
      };
    }),
  setBranchs: (branchs: Efr_Branches[]) =>
    set((state) => {
      // Kullanıcı değiştiğinde veya yeni şubeler yüklendiğinde
      // her zaman ilk şubeyi seç, önceki seçimleri dikkate alma
      let selectedBranches: Efr_Branches[] = [];
      if (branchs.length > 0) {
        selectedBranches = [branchs[0]];
      }
      
      return {
        selectedFilter: {
          ...state.selectedFilter,
          branches: branchs,
          selectedBranches: selectedBranches
        }
      };
    }),
  setTags: (tags: Efr_Tags[]) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        tags: [...new Set([...state.selectedFilter.tags, ...tags])]
      }
    })),
  setToDefaultFilters: () =>
    set((state) => {
      // Eğer şube listesi doluysa, ilk şubeyi seç
      const defaultSelectedBranches = state.selectedFilter.branches.length > 0 
        ? [state.selectedFilter.branches[0]] 
        : [];
        
      return {
        selectedFilter: {
          date: {
            from: new Date(new Date().setHours(0, 0, 0, 0)),
            to: new Date(new Date().setHours(23, 59, 59, 999))
          },
          branches: state.selectedFilter.branches,
          tags: state.selectedFilter.tags,
          selectedBranches: defaultSelectedBranches,
          selectedTags: [],
          appliedAt: undefined
        }
      };
    }),
  addBranch: (branch: Efr_Branches) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        branches: [...state.selectedFilter.branches, branch],
        tags: [...state.selectedFilter.tags]
      }
    })),

  handleStartDateSelect: (date: Date | undefined) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        date: {
          ...state.selectedFilter.date,
          from: date,
        },
        appliedAt: Date.now(),
      },
    })),

  handleEndDateSelect: (date: Date | undefined) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        date: {
          ...state.selectedFilter.date,
          to: date,
        },
        appliedAt: Date.now(),
      },
    })),

  handleDateRangeChange: (value: string) =>
    set((state) => {
      const today = new Date()
      let newDateRange: DateRange = {
        from: today,
        to: today
      }
      const { settings } = useSettingsStore();

      const daystart = parseInt(settings.find(setting => setting.Kod === "daystart")?.Value || '0');
      let startTime: string;
      let endTime: string;

      if (daystart === 0) {
        startTime = "00:00";
        endTime = "23:59";
      } else {
        const startHour = daystart.toString().padStart(2, '0');
        startTime = `${startHour}:00`;
        const endHour = ((daystart - 1 + 24) % 24).toString().padStart(2, '0');
        endTime = `${endHour}:59`;
      }

      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);


      switch (value) {
        case 'today':
          newDateRange = {
            from: new Date(new Date(today).setHours(startHours, startMinutes, 0)),
            to: daystart !== 0
              ? new Date(addDays(new Date(today).setHours(endHours, endMinutes, 59), 1))
              : new Date(new Date(today).setHours(endHours, endMinutes, 59))
          }
          break
        case 'yesterday':
          const yesterday = subDays(today, 1)
          newDateRange = {
            from: new Date(new Date(yesterday).setHours(startHours, startMinutes, 0)),
            to: daystart !== 0
              ? new Date(addDays(new Date(yesterday).setHours(endHours, endMinutes, 59), 1))
              : new Date(new Date(yesterday).setHours(endHours, endMinutes, 59))
          }
          break
        case 'thisWeek':
          const weekStart = startOfWeek(new Date(new Date(today).setHours(startHours, startMinutes, 0)), { weekStartsOn: 1 });
          const weekEnd = endOfWeek(new Date(new Date(today).setHours(endHours, endMinutes, 59)), { weekStartsOn: 1 });
          newDateRange = {
            from: weekStart,
            to: daystart !== 0
              ? addDays(weekEnd, 1)
              : weekEnd
          }
          break

        case 'lastWeek':
          const lastWeekStart = startOfWeek(subWeeks(new Date(new Date(today).setHours(startHours, startMinutes, 0)), 1), { weekStartsOn: 1 });
          const lastWeekEnd = endOfWeek(subWeeks(new Date(new Date(today).setHours(endHours, endMinutes, 59)), 1), { weekStartsOn: 1 });
          newDateRange = {
            from: lastWeekStart,
            to: daystart !== 0
              ? addDays(lastWeekEnd, 1)
              : lastWeekEnd
          }
          break
        case 'thisMonth':
          const monthStart = startOfMonth(new Date(new Date(today).setHours(startHours, startMinutes, 0)));
          const monthEnd = endOfMonth(new Date(new Date(today).setHours(endHours, endMinutes, 59)));
          newDateRange = {
            from: monthStart,
            to: daystart !== 0
              ? addDays(monthEnd, 1)
              : monthEnd
          }
          break
        case 'lastMonth':
          const lastMonthStart = startOfMonth(subMonths(new Date(new Date(today).setHours(startHours, startMinutes, 0)), 1));
          const lastMonthEnd = endOfMonth(subMonths(new Date(new Date(today).setHours(endHours, endMinutes, 59)), 1));
          newDateRange = {
            from: lastMonthStart,
            to: daystart !== 0
              ? addDays(lastMonthEnd, 1)
              : lastMonthEnd
          }
          break
        case 'thisYear':
          const yearStart = startOfYear(new Date(new Date(today).setHours(startHours, startMinutes, 0)));
          const yearEnd = endOfYear(new Date(new Date(today).setHours(endHours, endMinutes, 59)));
          newDateRange = {
            from: yearStart,
            to: daystart !== 0
              ? addDays(yearEnd, 1)
              : yearEnd
          }
          break
        case 'lastYear':
          const lastYearStart = startOfYear(subYears(new Date(new Date(today).setHours(startHours, startMinutes, 0)), 1));
          const lastYearEnd = endOfYear(subYears(new Date(new Date(today).setHours(endHours, endMinutes, 59)), 1));
          newDateRange = {
            from: lastYearStart,
            to: daystart !== 0
              ? addDays(lastYearEnd, 1)
              : lastYearEnd
          }
          break
        case 'lastSevenDays':
          const sevenDaysAgo = subDays(new Date(new Date(today).setHours(startHours, startMinutes, 0)), 7);
          newDateRange = {
            from: sevenDaysAgo,
            to: daystart !== 0
              ? addDays(new Date(new Date(today).setHours(endHours, endMinutes, 59)), 1)
              : new Date(new Date(today).setHours(endHours, endMinutes, 59))
          }
          break
        default:
          break
      }

      return {
        selectedFilter: {
          ...state.selectedFilter,
          date: newDateRange
        }
      }
    }),
  handleTagSelect: (tag: Efr_Tags) =>
    set((state) => {
      let newSelectedTags;

      // Eğer tag zaten seçiliyse, seçimi kaldır
      if (state.selectedFilter.selectedTags.some(t => t.TagID === tag.TagID)) {
        newSelectedTags = state.selectedFilter.selectedTags.filter(t => t.TagID !== tag.TagID);
      } else {
        // Tag seçili değilse, seçili tag'lere ekle
        newSelectedTags = [...state.selectedFilter.selectedTags, tag];
      }

      // Tüm seçili tag'lerin BranchID'lerini bir dizide topla
      const allBranchIDs = newSelectedTags.reduce((ids: string[], tag) => {
        return [...ids, ...tag.BranchID];
      }, []);

      // Bu BranchID'lere sahip tüm branch'ları seç
      const selectedBranches = state.selectedFilter.branches.filter(branch =>
        allBranchIDs.includes(branch.BranchID)
      );

      // Yeni state'i oluştur
      const newState = {
        selectedFilter: {
          ...state.selectedFilter,
          selectedTags: newSelectedTags,
          selectedBranches: selectedBranches
        },
      };

      // Tab store'u güncelle
      if (useTabStore.getState().activeTab) {
        useTabStore.getState().setTabFilter(useTabStore.getState().activeTab, newState.selectedFilter);
      }

      return newState;
    }),
}))
