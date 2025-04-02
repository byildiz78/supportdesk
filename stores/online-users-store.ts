import { create } from 'zustand';
import axios from '@/lib/axios';

interface OnlineUser {
    id: number;
    user_id: string;
    user_name: string;
    email: string;
    status: string;
    role: string;
    department: string;
    last_heartbeat: string;
}

interface OnlineUsersStore {
    users: OnlineUser[];
    isLoading: boolean;
    fetchOnlineUsers: () => Promise<void>;
}

export const useOnlineUsersStore = create<OnlineUsersStore>((set) => ({
    users: [],
    isLoading: false,
    fetchOnlineUsers: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get('/api/users/online');
            if (response.data.success) {
                set({ users: response.data.data });
            }
        } catch (error) {
            console.error('Failed to fetch online users:', error);
        } finally {
            set({ isLoading: false });
        }
    }
}));
