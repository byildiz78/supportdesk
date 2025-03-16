'use client';

import * as React from 'react';
import { UserPlus, Pencil, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common';
import { useTabStore } from "@/stores/tab-store";
import axios from "@/lib/axios";
import { useUsersStore } from "@/stores/settings/users/users-store";
import { toast } from '@/components/ui/toast/use-toast';
import { Efr_Users } from '@/pages/api/settings/users/types';
import { Efr_Branches } from '@/types/tables';

export default function UsersPage() {
    const { users, setUsers } = useUsersStore();
    const { addTab, setActiveTab } = useTabStore();
    const [isLoading, setIsLoading] = React.useState(true);
    const [branches, setBranches] = React.useState<Efr_Branches[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Önce kullanıcıları çek
                const usersResponse = await axios.get('/api/settings/users/settings_efr_users');
                setUsers(usersResponse.data);
                
                // Sonra şubeleri çek
                const branchesResponse = await axios.get('/api/settings/users/settings_efr_branches');
                setBranches(branchesResponse.data);
                
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Hata!",
                    description: "Veriler yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [setUsers]);

    const handleEditUser = (user: Efr_Users) => {
        const tabId = `edit-user-${user.UserID}`;
        const tab = {
            id: tabId,
            title: `Kullanıcı Düzenle - ${user.Name}`,
            props: { data: user, branches },
            lazyComponent: () => import('./create/user-form').then(module => ({
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
    
    const handleAddUserClick = () => {
        const tabId = "new-user-form";
        addTab({
            id: tabId,
            title: "Yeni Kullanıcı",
            props: { branches },
            lazyComponent: () => import('./create/user-form').then(module => ({
                default: (props: any) => <module.default {...props} />
            }))
        });
        setActiveTab(tabId);
    };

    // Define custom type for columns to match Efr_Users
    type CustomColumn = {
        key: string;
        title: string;
        width: string;
        fixed?: 'left' | 'right';
        sortable?: boolean;
        render: (user: Efr_Users) => React.ReactNode;
    };

    const columns: CustomColumn[] = [
        {
            key: 'Name',
            title: 'Ad Soyad',
            width: '250px',
            fixed: 'left',
            sortable: true,
            render: (user: Efr_Users) => (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/5 via-primary/5 to-blue-500/5 flex items-center justify-center ring-1 ring-border/50">
                            <svg className="w-4 h-4 text-primary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background shadow-sm flex items-center justify-center ring-1 ring-border/50">
                            <div className={`w-2 h-2 rounded-full ${user.IsActive
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{user.Name} {user.SurName}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'EMail',
            title: 'İletişim',
            width: '300px',
            render: (user: Efr_Users) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3.5 h-3.5 text-violet-500" />
                        <span>{user.EMail || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-muted-foreground">{user.PhoneNumber || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'Category',
            title: 'Rol',
            width: '150px',
            sortable: true,
            render: (user: Efr_Users) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/10 via-primary/10 to-blue-500/10 text-primary ring-1 ring-primary/20">
                    {getCategoryName(user.Category)}
                </span>
            )
        },
        {
            key: 'Schema',
            title: 'Şema',
            width: '180px',
            sortable: true,
            render: (user: Efr_Users) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
                    <span>{user.Schema || '-'}</span>
                </div>
            )
        },
        {
            key: 'IsActive',
            title: 'Durum',
            width: '150px',
            sortable: true,
            render: (user: Efr_Users) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
          ${user.IsActive
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                        : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-600 ring-1 ring-gray-500/20'}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.IsActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-[pulse_2s_ease-in-out_infinite]'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`} />
                    {user.IsActive ? 'Aktif' : 'Pasif'}
                </span>
            )
        },
        {
            key: 'UserName',
            title: 'Kullanıcı Adı',
            width: '200px',
            sortable: true,
            render: (user: Efr_Users) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm">{user.UserName || '-'}</span>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'İşlemler',
            width: '120px',
            render: (user: Efr_Users) => (
                <div className="flex items-center justify-start">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-24 hover:scale-105 hover:bg-violet-500/10 hover:text-violet-600 transition-all"
                        onClick={() => handleEditUser(user)}
                    >
                        <Pencil className="w-4 h-4 mr-1" />
                        <span className="text-sm">Düzenle</span>
                    </Button>
                </div>
            )
        }
    ];

    // Helper function to get category name from type
    const getCategoryName = (categoryType: number | string | undefined) => {
        const categories: Record<string, string> = {
            '1': 'Standart',
            '2': 'Çoklu Şube',
            '3': 'Bölge Sorumlusu',
            '4': 'Yönetici',
            '5': 'Süper Admin'
        };
        
        if (categoryType === undefined) return 'Bilinmiyor';
        return categories[categoryType.toString()] || categoryType.toString();
    };

    // Define custom type for filters
    type CustomFilter = {
        key: string;
        title: string;
        options: { label: string; value: string }[];
    };

    const filters: CustomFilter[] = [
        {
            key: 'Category',
            title: 'Rol',
            options: [
                { label: 'Standart', value: '1' },
                { label: 'Çoklu Şube', value: '2' },
                { label: 'Bölge Sorumlusu', value: '3' },
                { label: 'Yönetici', value: '4' },
                { label: 'Süper Admin', value: '5' }
            ]
        },
        {
            key: 'IsActive',
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
                    <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Sistem kullanıcılarını görüntüleyin, düzenleyin ve yeni kullanıcılar ekleyin.
                    </p>
                </div>
                <Button
                    onClick={handleAddUserClick}
                    className="bg-gradient-to-r from-violet-500 via-primary to-blue-500 text-white hover:from-violet-600 hover:via-primary/90 hover:to-blue-600 hover:shadow-md transition-all"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Yeni Kullanıcı
                </Button>
            </div>

            <DataTable<Efr_Users>
                data={users}
                columns={columns as any}
                filters={filters as any}
                isLoading={isLoading}
                searchPlaceholder="Kullanıcı ara..."
                searchFields={['Name', 'SurName', 'UserName', 'EMail', 'PhoneNumber'] as Array<keyof Efr_Users>}
                className="border rounded-lg shadow-sm"
                itemsPerPage={10}
                idField="UserID"
            />
        </div>
    );
}
