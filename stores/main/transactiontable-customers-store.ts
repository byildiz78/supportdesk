import { TransactionTableCustomer } from '@/pages/api/main/transactiontable/type';
import { create } from 'zustand';

interface TransactionsTableState {
  salesTransactionsTable: TransactionTableCustomer[];
  selectedSalesTransactionTable: TransactionTableCustomer | null;
  addSalesTransactionTable: (transaction: TransactionTableCustomer) => void;
  setSalesTransactionsTable: (transactions: TransactionTableCustomer[]) => void;
  setSelectedSalesTransactionTable: (transaction: TransactionTableCustomer | null) => void;
}

export const useSalesTransactionsStore = create<TransactionsTableState>((set) => ({
  salesTransactionsTable: [],
  selectedSalesTransactionTable: null,
  addSalesTransactionTable: (transaction) =>
    set((state) => ({       
      salesTransactionsTable: [transaction, ...state.salesTransactionsTable],
    })),
  setSalesTransactionsTable: (transactions) => set({ salesTransactionsTable: transactions }),
  setSelectedSalesTransactionTable: (transaction) => set({ selectedSalesTransactionTable: transaction }),
}));
