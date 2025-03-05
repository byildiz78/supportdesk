"use client";

import { createContext, useContext, useEffect } from "react";
import axios from "@/lib/axios";
import { Efr_Tags } from "@/types/tables";
import { useFilterStore } from "@/stores/filters-store";

const TagContext = createContext<{
    refetchTags: () => Promise<void>;
}>({
    refetchTags: async () => {},
});

export const useTagContext = () => useContext(TagContext);

export function TagProvider({ children }: { children: React.ReactNode }) {
    const { setTags } = useFilterStore();

    const fetchTags = async () => {
        try {
            const response = await axios.get<Efr_Tags[]>("/api/efr_tags", {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            setTags(response.data);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <TagContext.Provider value={{ refetchTags: fetchTags }}>
            {children}
        </TagContext.Provider>
    );
}
