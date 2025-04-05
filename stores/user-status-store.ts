import { create } from 'zustand';

export type UserStatus = 'online' | 'break' | 'away';

interface UserStatusStore {
    status: UserStatus;
    setStatus: (status: UserStatus) => void;
}

export const useUserStatusStore = create<UserStatusStore>((set) => ({
    status: 'online',
    setStatus: (status) => set({ status })
}));
