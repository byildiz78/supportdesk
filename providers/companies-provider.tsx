"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';
import { usePathname } from 'next/navigation';
import { Company } from '@/stores/main/companies-store';

interface CompaniesContextType {
  companies: Company[];
  loading: boolean;
  error: string | null;
  refreshCompanies: () => Promise<void>;
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(undefined);

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  const tenantId = pathname?.split('/')[1] || '';

  const fetchCompanies = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Önce localStorage'dan kontrol et
      const cachedData = localStorage.getItem(`companies_${tenantId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setCompanies(parsedData);
        setLoading(false);
      }
      
      // API'den verileri al
      const response = await axios.post('/api/main/companies/companiesList');
      const fetchedCompanies = response.data;
      
      // Verileri güncelle
      setCompanies(fetchedCompanies);
      setLoading(false);
      
      // LocalStorage'a kaydet
      localStorage.setItem(`companies_${tenantId}`, JSON.stringify(fetchedCompanies));
    } catch (err) {
      console.error('Şirketler yüklenirken hata oluştu:', err);
      setError('Şirketler yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchCompanies();
    }
  }, [tenantId]);

  const refreshCompanies = async () => {
    await fetchCompanies();
  };

  return (
    <CompaniesContext.Provider value={{ companies, loading, error, refreshCompanies }}>
      {children}
    </CompaniesContext.Provider>
  );
}

export function useCompanies() {
  const context = useContext(CompaniesContext);
  if (context === undefined) {
    throw new Error('useCompanies must be used within a CompaniesProvider');
  }
  return context;
}
