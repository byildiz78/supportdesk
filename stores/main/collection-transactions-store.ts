import { BonusCollectionTransactionCustomer } from '@/pages/api/main/collectiontransactions/type';
import { create } from 'zustand';

interface CollectionTransactionsState {
  collectionTransactions: BonusCollectionTransactionCustomer[];
  selectedCollectionTransaction: BonusCollectionTransactionCustomer | null;
  addCollectionTransaction: (transaction: BonusCollectionTransactionCustomer) => void;
  setCollectionTransactions: (transactions: BonusCollectionTransactionCustomer[]) => void;
  setSelectedCollectionTransaction: (transaction: BonusCollectionTransactionCustomer | null) => void;
}

export const useCollectionTransactionsStore = create<CollectionTransactionsState>((set) => ({
  collectionTransactions: [],
  selectedCollectionTransaction: null,
  addCollectionTransaction: (transaction) =>
    set((state) => ({       
      collectionTransactions: [transaction, ...state.collectionTransactions],
    })),
  setCollectionTransactions: (transactions) => set({ collectionTransactions: transactions }),
  setSelectedCollectionTransaction: (transaction) => set({ selectedCollectionTransaction: transaction }),
}));
