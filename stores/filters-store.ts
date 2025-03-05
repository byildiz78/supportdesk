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
      // Tüm seçili tag'lerin branch'larını birleştir
      const allBranchIDs = filter.selectedTags?.reduce((ids: string[], tag) => {
        return [...ids, ...tag.BranchID];
      }, []) || [];

      const effectiveBranches = filter.selectedTags?.length > 0
        ? filter.selectedBranches.filter(branch =>
            allBranchIDs.includes(branch.BranchID)
          )
        : filter.selectedBranches;

      // Mevcut tab'ın filter'ını al
      const activeTab = useTabStore.getState().activeTab;
      const currentTabFilter = useTabStore.getState().getTabFilter(activeTab);
      
      const newFilter = {
        ...filter,
        selectedBranches: effectiveBranches,
        selectedTags: filter.selectedTags || [],
        tags: filter.tags || state.selectedFilter.tags,
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
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        branches: branchs
      }
    })),
  setTags: (tags: Efr_Tags[]) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        tags: [...new Set([...state.selectedFilter.tags, ...tags])]
      }
    })),
  setToDefaultFilters: () =>
    set(() => ({
      selectedFilter: {
        date: {
          from: new Date(new Date().setHours(0, 0, 0, 0)),
          to: new Date(new Date().setHours(23, 59, 59, 999))
        },
        branches: [],
        tags: [],
        selectedBranches: [],
        selectedTags: [],
        appliedAt: undefined
      }
    })),
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
            to: new Date(new Date(today).setHours(startHours, startMinutes, 0))
          }
          break
        case 'yesterday':
          const yesterday = subDays(today, -1)
          newDateRange = {
            from: new Date(new Date(yesterday).setHours(startHours, startMinutes, 0)),
            to: new Date(today.setHours(endHours, endMinutes, 59))
          }
          break
        case 'thisWeek':
          newDateRange = {
            from: startOfWeek(new Date(new Date(today).setHours(startHours, startMinutes, 0)), { weekStartsOn: 1 }),
            to: endOfWeek(new Date(new Date(today).setHours(startHours, startMinutes, 0)), { weekStartsOn: 1 })
          }
          break

        case 'lastWeek':
          const lastWeek = subWeeks(today, 1)
          newDateRange = {
            from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
            to: endOfWeek(lastWeek, { weekStartsOn: 1 })
          }
          break
        case 'thisMonth':
          newDateRange = {
            from: startOfMonth(today),
            to: endOfMonth(today)
          }
          break
        case 'lastMonth':
          const lastMonth = subMonths(today, 1)
          newDateRange = {
            from: startOfMonth(lastMonth),
            to: endOfMonth(lastMonth)
          }
          break
        case 'thisYear':
          newDateRange = {
            from: startOfYear(today),
            to: endOfYear(today)
          }
          break
        case 'lastYear':
          const lastYear = subYears(today, 1)
          newDateRange = {
            from: startOfYear(lastYear),
            to: endOfYear(lastYear)
          }
          break
        case 'lastSevenDays':
          newDateRange = {
            from: subDays(today, 7),
            to: today
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
