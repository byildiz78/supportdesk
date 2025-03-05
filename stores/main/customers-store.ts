import { Customer } from '@/pages/api/main/customers/type';
import { create } from 'zustand';

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  deleteCustomer: (CustomerID: number) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  selectedCustomer: null,
  addCustomer: (customer) =>
    set((state) => ({       
      customers: [customer, ...state.customers],
    })),
  updateCustomer: (customer) =>
    set((state) => ({
      customers: state.customers.map((c) => 
        c.CustomerID === customer.CustomerID ? customer : c
      ),
    })),
  setCustomers: (customers) => set({ customers }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  deleteCustomer: (CustomerID) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.CustomerID !== CustomerID),
      selectedCustomer: state.selectedCustomer?.CustomerID === CustomerID ? null : state.selectedCustomer
    })),
}));
