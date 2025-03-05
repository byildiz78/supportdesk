import { create } from 'zustand';
import axios from "@/lib/axios";


interface User {
  UserID: number;
  UserName: string;
  UserBranchs: string;
}

interface UserStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get('/api/efr_users');
      set({ users: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch users', isLoading: false });
      console.error('Error fetching users:', error);
    }
  },
}));
