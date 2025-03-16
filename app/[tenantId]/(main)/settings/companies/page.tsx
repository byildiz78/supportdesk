'use client';

import * as React from 'react';
import { Building2, Pencil, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common';
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";
import { toast } from '@/components/ui/toast/use-toast';
import { useCompaniesStore } from '@/stores/companies/companies-store';
import { Efr_Companies } from '@/pages/api/settings/companies/types';

export default function CompaniesPage() {
    const { companies, setCompanies } = useCompaniesStore();
    const { addTab, setActiveTab } = useTabStore();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/api/settings/companies/settings_compoanies');
                setCompanies(response.data);
            } catch (error) {
                console.error('Error fetching companies:', error);
                toast({
                    title: "Hata!",
                    description: "Firmalar yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, [setCompanies]);

    const handleEditCompany = (company: Efr_Companies) => {
        const tabId = `edit-company-${company.id}`;
        const tab = {
            id: tabId,
            title: `Firma Düzenle - ${company.companyName}`,
            props: { data: company },
            lazyComponent: () => import('./create/company-form').then(module => ({
                default: (props: any) => {
                    const Component = module.default;
                    const tabProps = useTabStore.getState().getTabProps(tabId);
                    return <Component {...tabProps} />;
                }
            }))
        };
        addTab(tab);
        setActiveTab(tabId);
    };
    
    const handleAddCompanyClick = () => {
        const tabId = "new-company-form";
        addTab({
            id: tabId,
            title: "Yeni Firma",
            lazyComponent: () => import('./create/company-form').then(module => ({
                default: (props: any) => <module.default {...props} />
            }))
        });
        setActiveTab(tabId);
    };

    // Define custom type for columns to match Efr_Companies
    type CustomColumn = {
        key: string;
        title: string;
        width: string;
        fixed?: 'left' | 'right';
        sortable?: boolean;
        render: (company: Efr_Companies) => React.ReactNode;
    };

    const columns: CustomColumn[] = [
        {
            key: 'companyName',
            title: 'Firma Adı',
            width: '250px',
            fixed: 'left',
            sortable: true,
            render: (company: Efr_Companies) => (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/5 via-primary/5 to-blue-500/5 flex items-center justify-center ring-1 ring-border/50">
                            <Building2 className="w-4 h-4 text-primary/40" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background shadow-sm flex items-center justify-center ring-1 ring-border/50">
                            <div className={`w-2 h-2 rounded-full ${company.isActive
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{company.companyName}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'tenantName',
            title: 'Tenant Adı',
            width: '200px',
            sortable: true,
            render: (company: Efr_Companies) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                        <Database className="w-3.5 h-3.5 text-violet-500" />
                        <span>{company.tenantName || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'companyKey',
            title: 'Firma Anahtarı',
            width: '200px',
            sortable: true,
            render: (company: Efr_Companies) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span>{company.companyKey || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'isActive',
            title: 'Durum',
            width: '150px',
            sortable: true,
            render: (company: Efr_Companies) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
          ${company.isActive
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                        : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-600 ring-1 ring-gray-500/20'}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${company.isActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-[pulse_2s_ease-in-out_infinite]'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`} />
                    {company.isActive ? 'Aktif' : 'Pasif'}
                </span>
            )
        },
        {
            key: 'addDate',
            title: 'Eklenme Tarihi',
            width: '180px',
            sortable: true,
            render: (company: Efr_Companies) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm">{company.addDate ? new Date(company.addDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
            )
        },
        {
            key: 'addUser',
            title: 'Ekleyen Kullanıcı',
            width: '180px',
            sortable: true,
            render: (company: Efr_Companies) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm">{company.addUser || '-'}</span>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'İşlemler',
            width: '120px',
            render: (company: Efr_Companies) => (
                <div className="flex items-center justify-start">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-24 hover:scale-105 hover:bg-violet-500/10 hover:text-violet-600 transition-all"
                        onClick={() => handleEditCompany(company)}
                    >
                        <Pencil className="w-4 h-4 mr-1" />
                        <span className="text-sm">Düzenle</span>
                    </Button>
                </div>
            )
        }
    ];

    // Define custom type for filters
    type CustomFilter = {
        key: string;
        title: string;
        options: { label: string; value: string }[];
    };

    const filters: CustomFilter[] = [
        {
            key: 'isActive',
            title: 'Durum',
            options: [
                { label: 'Aktif', value: 'true' },
                { label: 'Pasif', value: 'false' }
            ]
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Firma Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Sistem firmalarını görüntüleyin, düzenleyin ve yeni firmalar ekleyin.
                    </p>
                </div>
                <Button
                    onClick={handleAddCompanyClick}
                    className="bg-gradient-to-r from-violet-500 via-primary to-blue-500 text-white hover:from-violet-600 hover:via-primary/90 hover:to-blue-600 hover:shadow-md transition-all"
                >
                    <Building2 className="w-4 h-4 mr-2" />
                    Yeni Firma
                </Button>
            </div>

            <DataTable<Efr_Companies>
                data={companies}
                columns={columns as any}
                filters={filters as any}
                isLoading={isLoading}
                searchPlaceholder="Firma ara..."
                searchFields={['companyName', 'tenantName', 'companyKey', 'addUser'] as Array<keyof Efr_Companies>}
                className="border rounded-lg shadow-sm"
                itemsPerPage={10}
                idField="id"
            />
        </div>
    );
}
