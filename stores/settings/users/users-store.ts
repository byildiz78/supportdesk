import { create } from 'zustand';
import { Efr_Users } from '@/pages/api/settings/users/types';

interface UsersState {
  users: Efr_Users[];
  selectedUser: Efr_Users | null;
  addUser: (user: Efr_Users) => void;
  updateUser: (user: Efr_Users) => void;
  setUsers: (users: Efr_Users[]) => void;
  setSelectedUser: (user: Efr_Users | null) => void;
  deleteUser: (userId: number) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  selectedUser: null,
  addUser: (user) =>
    set((state) => ({
      users: [user, ...state.users],
    })),
  updateUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => 
        u.UserID === user.UserID ? user : u
      ),
    })),
  setUsers: (users) => set({ users }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  deleteUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.UserID !== userId),
      selectedUser: state.selectedUser?.UserID === userId ? null : state.selectedUser
    })),
}));
