"use client"

import React from "react"
import { Building, Loader2, Search } from "lucide-react"
import ReactSelect from "react-select"
import { Company, BaseTicketComponentProps, SelectOption } from "./types"

interface CompanySelectorProps extends BaseTicketComponentProps {
    companies: Company[];
    filteredCompanies: Company[];
    companySearch: string;
    selectedCompanyId?: string;
    handleCompanyChange: (companyId?: string) => void;
    handleCompanyInputChange: (inputValue: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
    companies,
    filteredCompanies,
    companySearch,
    selectedCompanyId,
    handleCompanyChange,
    handleCompanyInputChange,
    selectClassNames,
    selectStyles,
    selectTheme,
    menuPortalTarget,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-500">Firmalar yükleniyor...</span>
            </div>
        );
    }

    const companyOptions: SelectOption[] = filteredCompanies.map(company => ({
        value: company.id,
        label: company.name
    }));

    return (
        <div className="flex items-start space-x-2">
            <Building className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
            <div className="w-full relative">
                <ReactSelect
                    options={companyOptions}
                    value={companyOptions.find(option => option.value === selectedCompanyId)}
                    onChange={(option) => handleCompanyChange(option?.value)}
                    onInputChange={handleCompanyInputChange}
                    placeholder="Seçiniz"
                    className="w-full max-w-full"
                    classNames={selectClassNames}
                    styles={selectStyles}
                    menuPortalTarget={menuPortalTarget}
                    unstyled
                    theme={selectTheme}
                    isClearable
                    filterOption={() => true}
                    noOptionsMessage={() => "Firma bulunamadı"}
                    loadingMessage={() => "Yükleniyor..."}
                    isLoading={isLoading}
                    components={{
                        LoadingIndicator: () => (
                            <div className="flex items-center">
                                <Loader2 className="h-3 w-3 animate-spin" />
                            </div>
                        )
                    }}
                />
                {companies.length > 100 && companySearch.length === 0 && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        <span>Aramak için yazmaya başlayın (toplam {companies.length} firma)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanySelector;
