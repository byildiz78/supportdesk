import { create } from "zustand";

export const REFRESH_INTERVAL = 90000;

interface RefreshStore {
    countdown: number;
    shouldFetch: boolean;
    setCountdown: (value: number | ((prev: number) => number)) => void;
    setShouldFetch: (value: boolean) => void;
}

export const useRefreshStore = create<RefreshStore>((set) => ({
    countdown: REFRESH_INTERVAL / 1000,
    shouldFetch: false,
    setCountdown: (value) => set((state) => ({ 
        countdown: typeof value === 'function' ? value(state.countdown) : value 
    })),
    setShouldFetch: (value) => set({ shouldFetch: value }),
}));
