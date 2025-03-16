import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DatabaseResponse } from "@/types/dataset";
import { Dataset } from "@/lib/dataset";
import * as LucideIcons from "lucide-react";
import React from 'react'

interface FormatNumberOptions {
    decimals?: number;
    delimiter?: string;
    decimalPoint?: string;
    prefix?: string;
    suffix?: string;
}

interface IntlFormatNumberOptions {
    locale?: string;
    style?: 'decimal' | 'currency' | 'percent' | 'unit';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    currency?: string;
}

export const getLucideIcon = (iconName: string | undefined, defaultIcon?: LucideIcons.Icon): LucideIcons.Icon => {
    if (!iconName) return defaultIcon || LucideIcons.HelpCircle;

    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcons.Icon;
    return Icon || defaultIcon || LucideIcons.HelpCircle;
};

const databaseCache = new Map<string, { database: DatabaseResponse | undefined; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function checkTenantDatabase(tenantId: string): Promise<DatabaseResponse | undefined> {
    // For Bolt mode, return a mock database response
    if (process.env.IS_BOLT === "1") {
        return {
            databaseId: "1",
            tenantId: process.env.BOLTTENANT || "",
            apiKey: process.env.DATASET_API_TOKEN || "",
            database: "mock_database"
        };
    }

    const cached = databaseCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.database !== undefined) {
        return cached.database;
    }

    try {
        const instance = Dataset.getInstance();
        const databases = await instance.getDatabase<DatabaseResponse[]>();
        const database = databases.find(item => item.tenantId === tenantId);
        databaseCache.set(tenantId, { database, timestamp: Date.now() });
        return database;
    } catch (error) {
        console.warn('Database check failed:', error);
        return undefined;
    }
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatDateTime = (timestamp: string | any) => {
    const date = new Date(timestamp);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const time = date.toISOString().slice(11, 16);

    return `${day}.${month}.${year} ${time}`;
};

export const formatDates = (timestamp: string | any) => {
    // Eğer tarih zaten "DD.MM.YYYY" formatındaysa, doğrudan döndür
    if (typeof timestamp === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(timestamp)) {
        return timestamp;
    }
    
    try {
        const date = new Date(timestamp);
        // Geçerli bir tarih mi kontrol et
        if (isNaN(date.getTime())) {
            return timestamp; // Geçersiz tarih ise orijinal değeri döndür
        }
        
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();

        return `${day}.${month}.${year}`;
    } catch (error) {
        // Herhangi bir hata durumunda orijinal değeri döndür
        return timestamp;
    }
};

export const formatDateTimeDMY = (date: Date | undefined) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export const formatDateTimeYMDHIS = (date: Date | undefined) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const formatDateTimeYMDHI = (date: Date | undefined) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export const formatDateTimeDMYHI = (date: Date | undefined | null) => {
    // Null, undefined veya geçerli bir Date nesnesi olup olmadığını kontrol edelim
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';

    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error("Tarih formatlanırken hata oluştu:", error);
        return '';
    }
}

export function extractTenantId(referer: string | undefined): string {
    if (!referer) {
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : "";
    }
    try {
        const tenantId = new URL(referer).pathname.replace(process.env.NEXT_PUBLIC_BASEPATH || '', '').split("/")[1] || '';
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : tenantId;
    } catch (error) {
        console.error('Error parsing referer:', error);
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : "";
    }
}

export const extractTenantFromBody = (tenantId: any): string | null => {
    // Not provided
    if (!tenantId) return null;

    // Single value (string) case
    if (!Array.isArray(tenantId)) return tenantId;

    // Empty array
    if (tenantId.length === 0) return null;

    // Single item array with valid properties
    if (tenantId.length === 1) {
        const item = tenantId[0];
        return item.BranchName || item.BranchID || null;
    }

    // Multiple items
    return null;
};


// Kart tipi için ikon adını döndüren fonksiyon
export const getCardTypeIconName = (cardType: string | undefined): string => {
    switch (cardType?.toLowerCase()) {
        case 'meal':
            return 'CreditCard';
        case 'gift':
            return 'Gift';
        case 'corporate':
            return 'Building2';
        default:
            return 'HelpCircle';
    }
};

// Kart tipi için etiket döndüren fonksiyon
export const getCardTypeLabel = (cardType: string | undefined): string => {
    switch (cardType?.toLowerCase()) {
        case 'meal':
            return 'Yemek Kartı';
        case 'gift':
            return 'Hediye Kartı';
        case 'corporate':
            return 'Kurumsal Kart';
        default:
            return 'Belirtilmemiş';
    }
};

// Kart tipi için badge stilini döndüren fonksiyon
export const getCardTypeBadgeStyle = (cardType: string | undefined): string => {
    switch (cardType?.toLowerCase()) {
        case 'meal':
            return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
        case 'gift':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800';
        case 'corporate':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        default:
            return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
};