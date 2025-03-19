"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';
import { usePathname } from 'next/navigation';

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  companyId?: string;
  companyName?: string;
  // Eski alan isimleri için geri uyumluluk
  first_name?: string;
  last_name?: string;
  company_id?: string;
  company_name?: string;
  // Diğer contact alanları burada tanımlanabilir
}

interface ContactsContextType {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  const tenantId = pathname?.split('/')[1] || '';

  const fetchContacts = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Önce localStorage'dan kontrol et
      const cachedData = localStorage.getItem(`contacts_${tenantId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setContacts(parsedData);
        setLoading(false);
      }
      
      // API'den verileri al
      const response = await axios.post('/api/main/contacts/contactsList');
      const fetchedContacts = response.data;
      
      // Verileri güncelle
      setContacts(fetchedContacts);
      setLoading(false);
      
      // LocalStorage'a kaydet
      localStorage.setItem(`contacts_${tenantId}`, JSON.stringify(fetchedContacts));
    } catch (err) {
      console.error('Kişiler yüklenirken hata oluştu:', err);
      setError('Kişiler yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchContacts();
    }
  }, [tenantId]);

  const refreshContacts = async () => {
    await fetchContacts();
  };

  return (
    <ContactsContext.Provider value={{ contacts, loading, error, refreshContacts }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
