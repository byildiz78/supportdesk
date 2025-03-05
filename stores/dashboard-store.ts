import { create } from "zustand";

interface DashboardStore {
    isDashboardTab: boolean;
    setIsDashboardTab: (value: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
    isDashboardTab: false,
    setIsDashboardTab: (value) => set({ isDashboardTab: value }),
}));
