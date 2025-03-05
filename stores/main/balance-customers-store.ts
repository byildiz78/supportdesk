import { BalanceCustomer } from '@/pages/api/main/balances/type';
import { create } from 'zustand';

interface BalanceCustomersState {
  balanceCustomers: BalanceCustomer[];
  selectedBalanceCustomer: BalanceCustomer | null;
  addBalanceCustomer: (customer: BalanceCustomer) => void;
  setBalanceCustomers: (customers: BalanceCustomer[]) => void;
  setSelectedBalanceCustomer: (customer: BalanceCustomer | null) => void;
}

export const useBalanceCustomersStore = create<BalanceCustomersState>((set) => ({
  balanceCustomers: [],
  selectedBalanceCustomer: null,
  addBalanceCustomer: (customer) =>
    set((state) => ({       
      balanceCustomers: [customer, ...state.balanceCustomers],
    })),
  setBalanceCustomers: (customers) => set({ balanceCustomers: customers }),
  setSelectedBalanceCustomer: (customer) => set({ selectedBalanceCustomer: customer }),
}));
