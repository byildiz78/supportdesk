"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ParentCompanyHeader } from "./components/ParentCompanyHeader";
import { ParentCompanyList } from "./components/ParentCompanyList";
import { ParentCompanyFilters } from "./components/ParentCompanyFilters";
import { ParentCompanyPagination } from "./components/ParentCompanyPagination";
import { useParentCompanies } from "@/hooks/use-parent-companies";

export default function ParentCompaniesPage() {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // PostgreSQL veritabanı entegrasyonu için useParentCompanies hook'unu kullan
    const { 
        parentCompanies, 
        total, 
        isLoading, 
        error, 
        fetchParentCompanies 
    } = useParentCompanies({
        initialLoad: true,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
    });
    
    // Arama terimini değiştirdiğimizde verileri yeniden getir
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchParentCompanies({
                search: searchTerm,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentPage, itemsPerPage, fetchParentCompanies]);

    // Sayfa değiştiğinde verileri yeniden getir
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Sayfa başına öğe sayısı değiştiğinde verileri yeniden getir
    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1); // Sayfa başına öğe sayısı değiştiğinde ilk sayfaya dön
    };

    // Arama terimi değiştiğinde verileri yeniden getir
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); // Arama terimi değiştiğinde ilk sayfaya dön
    };

    // Ana şirket silindiğinde verileri yeniden getir
    const handleCompanyDeleted = () => {
        fetchParentCompanies({
            search: searchTerm,
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage
        });
    };

    return (
        <div className="flex flex-col h-full">
            <ParentCompanyHeader />
            <ParentCompanyFilters 
                searchTerm={searchTerm} 
                onSearchChange={handleSearchChange} 
            />
            <ParentCompanyList 
                companies={parentCompanies} 
                isLoading={isLoading} 
                error={error}
                onCompanyDeleted={handleCompanyDeleted}
            />
            <ParentCompanyPagination 
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={total}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
        </div>
    );
}
