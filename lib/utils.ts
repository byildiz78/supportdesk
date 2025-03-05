import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DatabaseResponse } from "@/types/dataset";
import { Dataset } from "@/lib/dataset";
import * as LucideIcons from "lucide-react";
import { DivideIcon as LucideIcon } from "lucide-react";

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

export const getLucideIcon = (iconName: string | undefined, defaultIcon?: LucideIcon): LucideIcon => {
    if (!iconName) return defaultIcon || LucideIcons.HelpCircle;
    
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon;
    return Icon || defaultIcon || LucideIcons.HelpCircle;
};

const databaseCache = new Map<string, { database: DatabaseResponse | undefined; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function checkTenantDatabase(tenantId: string): Promise<DatabaseResponse | undefined> {
    // For Bolt mode, return a mock database response
    if(process.env.IS_BOLT === "1") {
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

export const formatDateTimeDMYHI = (date: Date | undefined) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function extractTenantId(referer: string | undefined): string {
    if (!referer) {
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : "";
    }
    try {
        const tenantId = new URL(referer).pathname.replace(process.env.NEXT_PUBLIC_BASEPATH ||'', '').split("/")[1] || '';
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : tenantId;
    } catch (error) {
        console.error('Error parsing referer:', error);
        return process.env.IS_BOLT === "1" ? process.env.BOLTTENANT || "" : "";
    }
}