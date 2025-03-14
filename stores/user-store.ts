import { create } from 'zustand';
import { User, UserFilter } from '@/types/users';

interface UserStore {
    users: User[];
    selectedUser: User | null;
    filters: UserFilter;
    isLoading: boolean;
    error: string | null;
    setUsers: (users: User[]) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    setSelectedUser: (user: User | null) => void;
    setFilters: (filters: UserFilter) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    users: [],
    selectedUser: null,
    filters: {},
    isLoading: false,
    error: null,
    setUsers: (users) => set({ users }),
    addUser: (user) => set((state) => ({ users: [user, ...state.users] })),
    updateUser: (user) => set((state) => ({
        users: state.users.map((u) => u.id === user.id ? user : u),
        selectedUser: state.selectedUser?.id === user.id ? user : state.selectedUser
    })),
    deleteUser: (userId) => set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser
    })),
    setSelectedUser: (user) => set({ selectedUser: user }),
    setFilters: (filters) => set({ filters }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error })
}));
