import { create } from "zustand";

interface FilterEventStore {
    filterApplied: boolean;
    setFilterApplied: (value: boolean) => void;
}

export const useFilterEventStore = create<FilterEventStore>((set) => ({
    filterApplied: false,
    setFilterApplied: (value) => set({ filterApplied: value }),
}));
