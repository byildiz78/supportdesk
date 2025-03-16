import { create } from 'zustand';
import { Efr_Companies } from '@/pages/api/settings/companies/types';

interface CompaniesState {
  companies: Efr_Companies[];
  selectedCompany: Efr_Companies | null;
  addCompany: (company: Efr_Companies) => void;
  updateCompany: (company: Efr_Companies) => void;
  setCompanies: (companies: Efr_Companies[]) => void;
  setSelectedCompany: (company: Efr_Companies | null) => void;
  deleteCompany: (companyId: number) => void;
}

export const useCompaniesStore = create<CompaniesState>((set) => ({
  companies: [],
  selectedCompany: null,
  addCompany: (company) =>
    set((state) => ({
      companies: [company, ...state.companies],
    })),
  updateCompany: (company) =>
    set((state) => ({
      companies: state.companies.map((c) => 
        c.id === company.id ? company : c
      ),
    })),
  setCompanies: (companies) => set({ companies }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  deleteCompany: (companyId) =>
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== companyId),
      selectedCompany: state.selectedCompany?.id === companyId ? null : state.selectedCompany
    })),
}));
