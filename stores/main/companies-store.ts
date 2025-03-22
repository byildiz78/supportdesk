// Define the Company type inline to avoid import issues
export type Company = {
  id: string;
  uuid?: string;
  parentCompanyId?: string;
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
  isDeleted?: boolean;
  // Flow fields
  flow_id?: string;
  flow_ba_starting_date?: string;
  flow_ba_end_date?: string;
  flow_ba_notes?: string;
  flow_support_notes?: string;
  flow_licence_notes?: string;
  flow_last_update_date?: string;
};

import { create } from 'zustand';

interface CompaniesState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  setCompanies: (companies: Company[]) => void;
  setSelectedCompany: (company: Company | null) => void;
  deleteCompany: (companyId: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCompaniesStore = create<CompaniesState>((set) => ({
  companies: [],
  selectedCompany: null,
  isLoading: false,
  addCompany: (company) =>
    set((state) => ({       
      companies: [company, ...state.companies],
    })),
  updateCompany: (company) =>
    set((state) => ({
      companies: state.companies.map((c) => 
        c.id === company.id ? { ...c, ...company } : c
      ),
      selectedCompany: state.selectedCompany?.id === company.id 
        ? { ...state.selectedCompany, ...company } 
        : state.selectedCompany
    })),
  setCompanies: (companies) => set({ companies }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  deleteCompany: (companyId) =>
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== companyId),
      selectedCompany: state.selectedCompany?.id === companyId ? null : state.selectedCompany
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));