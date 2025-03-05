import { BonusTransactionCustomer } from '@/pages/api/main/salestransactions/type';
import { create } from 'zustand';

interface SalesTransactionsState {
  salesTransactions: BonusTransactionCustomer[];
  selectedSalesTransaction: BonusTransactionCustomer | null;
  addSalesTransaction: (transaction: BonusTransactionCustomer) => void;
  setSalesTransactions: (transactions: BonusTransactionCustomer[]) => void;
  setSelectedSalesTransaction: (transaction: BonusTransactionCustomer | null) => void;
}

export const useSalesTransactionsStore = create<SalesTransactionsState>((set) => ({
  salesTransactions: [],
  selectedSalesTransaction: null,
  addSalesTransaction: (transaction) =>
    set((state) => ({       
      salesTransactions: [transaction, ...state.salesTransactions],
    })),
  setSalesTransactions: (transactions) => set({ salesTransactions: transactions }),
  setSelectedSalesTransaction: (transaction) => set({ selectedSalesTransaction: transaction }),
}));
