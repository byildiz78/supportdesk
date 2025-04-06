"use client";

import {

    ChevronsUpDown,
    LogOut,
    Key,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import axios, { isAxiosError } from "@/lib/axios";

import { useRouter, usePathname } from "next/navigation";
import { useFilterStore } from "@/stores/filters-store";
import Image from "next/image";
import { useState } from "react";
import { ChangePasswordModal } from "@/components/change-password-modal";

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
        id: string;
    };
}) {
    const { isMobile } = useSidebar();
    const router = useRouter()
    const pathname = usePathname();
    const { setToDefaultFilters } = useFilterStore();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const Logout = () => {
        const tenantId = pathname?.split('/')[1] || '';

        // Kullanıcı verilerini temizle
        localStorage.removeItem(`userData_${tenantId}`);

        // Filtre ve şube seçimlerini sıfırla
        // Önce store'daki şube listesini temizleyelim ki, setToDefaultFilters çalıştığında
        // önceki kullanıcının şubeleri seçili kalmasın
        useFilterStore.getState().setBranchs([]);
        // Sonra filtreleri sıfırlayalım
        setToDefaultFilters();

        // Ek olarak, diğer store'lardaki verileri de temizlemek için localStorage'dan ilgili verileri silebiliriz
        // Örneğin, filtre ve şube seçimleri ile ilgili localStorage verileri
        localStorage.removeItem(`filter_${tenantId}`);
        localStorage.removeItem(`selectedBranches_${tenantId}`);
        localStorage.removeItem(`branches_${tenantId}`);

        // Tüm filtre ve ayarlarla ilgili localStorage verilerini temizlemek için
        Object.keys(localStorage).forEach(key => {
            if (key.includes(tenantId) && (key.includes('filter') || key.includes('branch') || key.includes('setting'))) {
                localStorage.removeItem(key);
            }
        });

        axios.get('/api/auth/logout').then(() => {
            router.push(`/${tenantId}/login`);

        }).catch(() => { });
    };
    return (
        <SidebarMenu>
            <SidebarMenuItem className="!bg-sky-100/80 dark:!bg-indigo-500/20 hover:!bg-sky-200/90 dark:hover:!bg-indigo-500/30 !rounded-xl !transition-all !duration-200">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <div className="relative h-full w-full">
                                    <Image
                                        src={user.avatar}
                                        alt={user.name}
                                        fill
                                        sizes="32px"
                                        priority
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                                {/* <AvatarFallback className="rounded-lg">
                                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback> */}
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs">
                                    {user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <div className="relative h-full w-full">
                                        <Image
                                            src={user.avatar}
                                            alt={user.name}
                                            fill
                                            sizes="32px"
                                            priority
                                            className="rounded-lg object-cover"
                                        />
                                    </div>
                                    {/* <AvatarFallback className="rounded-lg">
                                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                    </AvatarFallback> */}
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200 shadow-sm rounded-md"
                        >
                            <Key className="mr-2 h-4 w-4 text-gray-600" />
                            Şifre Değiştir
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={Logout}
                            className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-200 font-medium transition-colors duration-200 shadow-sm rounded-md mt-1"
                        >
                            <LogOut className="mr-2 h-4 w-4 text-red-500" />
                            Çıkış
                        </DropdownMenuItem>


                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            {/* Şifre değiştirme modalı */}
            <ChangePasswordModal
                open={isPasswordModalOpen}
                onOpenChange={setIsPasswordModalOpen}
                userId={user.id}
            />
        </SidebarMenu>
    );
}
/*
    <DropdownMenuGroup>
        <DropdownMenuItem>
            <Sparkles />
            Upgrade to Pro
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
        <DropdownMenuItem>
            <BadgeCheck />
            Account
        </DropdownMenuItem>
        <DropdownMenuItem>
            <CreditCard />
            Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
            <Bell />
            Notifications
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
*/
