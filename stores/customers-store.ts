import { create } from 'zustand';
import { MainCompany, Company, Contact } from '@/types/customers';

interface CustomersState {
    mainCompanies: MainCompany[];
    companies: Company[];
    contacts: Contact[];
    selectedMainCompany: MainCompany | null;
    selectedCompany: Company | null;
    selectedContact: Contact | null;
    isLoading: boolean;
    error: string | null;

    // Main Companies
    setMainCompanies: (companies: MainCompany[]) => void;
    addMainCompany: (company: MainCompany) => void;
    updateMainCompany: (company: MainCompany) => void;
    deleteMainCompany: (id: string) => void;
    setSelectedMainCompany: (company: MainCompany | null) => void;

    // Companies
    setCompanies: (companies: Company[]) => void;
    addCompany: (company: Company) => void;
    updateCompany: (company: Company) => void;
    deleteCompany: (id: string) => void;
    setSelectedCompany: (company: Company | null) => void;

    // Contacts
    setContacts: (contacts: Contact[]) => void;
    addContact: (contact: Contact) => void;
    updateContact: (contact: Contact) => void;
    deleteContact: (id: string) => void;
    setSelectedContact: (contact: Contact | null) => void;

    // Common
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
    mainCompanies: [],
    companies: [],
    contacts: [],
    selectedMainCompany: null,
    selectedCompany: null,
    selectedContact: null,
    isLoading: false,
    error: null,

    // Main Companies
    setMainCompanies: (companies) => set({ mainCompanies: companies }),
    addMainCompany: (company) => set((state) => ({ 
        mainCompanies: [...state.mainCompanies, company] 
    })),
    updateMainCompany: (company) => set((state) => ({
        mainCompanies: state.mainCompanies.map((c) => 
            c.id === company.id ? company : c
        )
    })),
    deleteMainCompany: (id) => set((state) => ({
        mainCompanies: state.mainCompanies.filter((c) => c.id !== id)
    })),
    setSelectedMainCompany: (company) => set({ selectedMainCompany: company }),

    // Companies
    setCompanies: (companies) => set({ companies }),
    addCompany: (company) => set((state) => ({ 
        companies: [...state.companies, company] 
    })),
    updateCompany: (company) => set((state) => ({
        companies: state.companies.map((c) => 
            c.id === company.id ? company : c
        )
    })),
    deleteCompany: (id) => set((state) => ({
        companies: state.companies.filter((c) => c.id !== id)
    })),
    setSelectedCompany: (company) => set({ selectedCompany: company }),

    // Contacts
    setContacts: (contacts) => set({ contacts }),
    addContact: (contact) => set((state) => ({ 
        contacts: [...state.contacts, contact] 
    })),
    updateContact: (contact) => set((state) => ({
        contacts: state.contacts.map((c) => 
            c.id === contact.id ? contact : c
        )
    })),
    deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id)
    })),
    setSelectedContact: (contact) => set({ selectedContact: contact }),

    // Common
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error })
}));