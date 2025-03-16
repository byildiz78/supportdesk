// Define the ParentCompany type inline to avoid import issues
type ParentCompany = {
  id: string;
  uuid: string;
  name: string;
  taxId?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  companyType?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
  isDeleted: boolean;
};

import { create } from 'zustand';

interface ParentCompaniesState {
  parentCompanies: ParentCompany[];
  selectedParentCompany: ParentCompany | null;
  addParentCompany: (parentCompany: ParentCompany) => void;
  updateParentCompany: (parentCompany: ParentCompany) => void;
  setParentCompanies: (parentCompanies: ParentCompany[]) => void;
  setSelectedParentCompany: (parentCompany: ParentCompany | null) => void;
  deleteParentCompany: (ParentCompanyID: number) => void;
}

export const useParentCompaniesStore = create<ParentCompaniesState>((set) => ({
  parentCompanies: [],
  selectedParentCompany: null,
  addParentCompany: (parentCompany) =>
    set((state) => ({       
      parentCompanies: [parentCompany, ...state.parentCompanies],
    })),
  updateParentCompany: (parentCompany) =>
    set((state) => ({
      parentCompanies: state.parentCompanies.map((c) => 
        c.id === parentCompany.id ? { ...c, ...parentCompany } : c
      ),
      selectedParentCompany: state.selectedParentCompany?.id === parentCompany.id 
        ? { ...state.selectedParentCompany, ...parentCompany } 
        : state.selectedParentCompany
    })),
  setParentCompanies: (parentCompanies) => set({ parentCompanies }),
  setSelectedParentCompany: (parentCompany) => set({ selectedParentCompany: parentCompany }),
  deleteParentCompany: (ParentCompanyID) =>
    set((state) => ({
      parentCompanies: state.parentCompanies.filter((c) => c.id !== ParentCompanyID.toString()),
      selectedParentCompany: state.selectedParentCompany?.id === ParentCompanyID.toString() ? null : state.selectedParentCompany
    })),
}));
