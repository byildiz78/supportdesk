// Define the Contact type inline to avoid import issues
export type Contact = {
  id: string;
  uuid?: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
  isDeleted: boolean;
};

import { create } from 'zustand';

interface ContactsState {
  contacts: Contact[];
  selectedContact: Contact | null;
  isLoading: boolean;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  setContacts: (contacts: Contact[]) => void;
  setSelectedContact: (contact: Contact | null) => void;
  deleteContact: (contactId: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  selectedContact: null,
  isLoading: false,
  addContact: (contact) =>
    set((state) => ({       
      contacts: [contact, ...state.contacts],
    })),
  updateContact: (contact) =>
    set((state) => ({
      contacts: state.contacts.map((c) => 
        c.id === contact.id ? { ...c, ...contact } : c
      ),
      selectedContact: state.selectedContact?.id === contact.id 
        ? { ...state.selectedContact, ...contact } 
        : state.selectedContact
    })),
  setContacts: (contacts) => set({ contacts }),
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  deleteContact: (contactId) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== contactId),
      selectedContact: state.selectedContact?.id === contactId ? null : state.selectedContact
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
