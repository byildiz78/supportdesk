import { useState, useEffect, useRef } from 'react';
import axios from "@/lib/axios";


interface AuditData {
    month: number;
    monthName: string;
    registrationCount: number;
}

interface UseAuditProps {
    branches: number[];
    date: string;
    refreshTrigger?: number;
}

export const useAuditTable = (params: UseAuditProps | null) => {
    const [data, setData] = useState<AuditData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestInProgress = useRef(false);
    const lastRequestData = useRef({
        branches: [],
        date: '',
        data: [] as AuditData[]
    });

    useEffect(() => {
        if (!params) {
            // Eğer params null ise ve cache'de data varsa, cache'den göster
            if (lastRequestData.current.data.length > 0) {
                setData(lastRequestData.current.data);
            }
            setIsLoading(false);
            setError(null);
            return;
        }

        const fetchData = async () => {
            // Params yoksa veya branches boşsa çık
            if (!params.branches?.length || requestInProgress.current) return;

            // Eğer aynı parametrelerle istek atılmışsa ve cache'de data varsa, cache'den göster
            const currentRequest = JSON.stringify({
                branches: params.branches,
                date: params.date
            });

            const lastRequest = JSON.stringify({
                branches: lastRequestData.current.branches,
                date: lastRequestData.current.date
            });

            if (currentRequest === lastRequest && lastRequestData.current.data.length > 0) {
                setData(lastRequestData.current.data);
                return;
            }

            requestInProgress.current = true;
            setIsLoading(true);
            setError(null);

            try {
                const response = await axios.post<AuditData[]>('/api/auditTable', {
                    branches: params.branches,
                    date: params.date
                });

                setData(response.data);
                lastRequestData.current = {
                    branches: params.branches,
                    date: params.date,
                    data: response.data
                };
            } catch (error) {
                console.error('Error:', error);
                setError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                setIsLoading(false);
                requestInProgress.current = false;
            }
        };

        if (params.refreshTrigger || !lastRequestData.current.data.length) {
            fetchData();
        }
    }, [params?.branches, params?.date, params?.refreshTrigger]);

    return { data, isLoading, error };
};