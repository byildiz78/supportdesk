"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios, {isAxiosError} from "@/lib/axios";

import { Efr_Branches } from "@/types/tables";
import { useFilterStore } from "@/stores/filters-store";

// Ülke kodları mapping'i
const countryToCode: { [key: string]: string } = {
    'TURKIYE': 'tr',
    'TÜRKİYE': 'tr',
    'INGILTERE': 'gb',
    'İNGILTERE': 'gb',
    'ROMANYA': 'ro',
    'KIBRIS': '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" fill="#e30a17"><path d="m0 0h900v600H0z" fill="#fff"/><circle cx="300" cy="300" r="150"/><circle cx="337.5" cy="300" r="120" fill="#fff"/><path d="M0 60h900v60H0zM0 480h900v60H0zM417.5 300l135.676275-44.083894-83.852549 115.413133v-142.658477l83.852549 115.413133z"/></svg>',
    'BAYLAN': 'tr',  // Varsayılan olarak TR
    'AZERBAYCAN': 'az',
    'AZERBEYCAN': 'az',  // Yanlış yazım için
    'IRAK': 'iq',
    'ISPANYA': 'es',
    'İSPANYA': 'es'
};

// Ülke ismini normalize etme fonksiyonu
const normalizeCountryName = (name: string | null | undefined): string => {
    if (!name) return 'TÜRKİYE';
    const normalized = name.toUpperCase()
        .replace('İ', 'I')
        .replace('Ü', 'U');
    
    // Eğer TURKIYE ise TÜRKİYE olarak değiştir
    if (normalized === 'TURKIYE') return 'TÜRKİYE';
    return normalized;
};

type CountryInfo = {
    name: string;
    code: string;
};

const BranchContext = createContext<{
    refetchBranches: () => Promise<void>;
    countries: CountryInfo[];
    selectedCountry: string;
    setSelectedCountry: (country: string) => void;
}>({
    refetchBranches: async () => {},
    countries: [],
    selectedCountry: 'TÜRKİYE',
    setSelectedCountry: () => {},
});

export const useBranchContext = () => useContext(BranchContext);

export function BranchProvider({ children }: { children: React.ReactNode }) {
    const { setBranchs } = useFilterStore();
    const [countries, setCountries] = useState<CountryInfo[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('TÜRKİYE');

    const fetchBranches = async () => {
        try {
            const response = await axios.get<Efr_Branches[]>("/api/efr_branches", {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            // Tüm şubeleri al
            const allBranches = response.data;
            
            // Ülkeleri ayıkla ve normalize et (null kontrolü ile)
            const uniqueCountries = [...new Set(allBranches
                .filter(branch => branch?.CountryName) // null veya undefined olanları filtrele
                .map(branch => normalizeCountryName(branch.CountryName))
            )];
            
            // Ülke bilgilerini oluştur
            const countryInfos = uniqueCountries.map(country => ({
                name: country,
                code: countryToCode[country] || 'tr' // Eğer kod bulunamazsa varsayılan olarak tr
            }));
            
            setCountries(countryInfos);
            
            // Seçili ülkeye göre şubeleri filtrele (normalize edilmiş isimlerle karşılaştır)
            const filteredBranches = allBranches.filter(branch => {
                const normalizedBranchCountry = normalizeCountryName(branch?.CountryName);
                return normalizedBranchCountry === selectedCountry;
            });
            
            setBranchs(filteredBranches);
            
        } catch (error) {
            console.error("❌ Şube yüklenirken hata:", error);
            if (isAxiosError(error)) {
                console.error("🔍 Detaylı hata:", {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                });
            }
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [selectedCountry]); // selectedCountry değiştiğinde yeniden fetch yap

    return (
        <BranchContext.Provider value={{ 
            refetchBranches: fetchBranches,
            countries,
            selectedCountry,
            setSelectedCountry
        }}>
            {children}
        </BranchContext.Provider>
    );
}
