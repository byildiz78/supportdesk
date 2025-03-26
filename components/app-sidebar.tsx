"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface NavItem {
    title: string;
    icon?: LucideIcons.LucideIcon;
    isActive?: boolean;
    expanded?: boolean;
    url?: string;
    component?: React.ComponentType<any>;
    items?: NavItem[];
    onClick?: () => void;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const tenantId = pathname?.split("/")[1] || "";
    const [userData, setUserData] = useState({ name: "", email: "" });
    

    const navItems = useMemo(() => {
        const items = [
            {
                title: "Dashboard",
                icon: LucideIcons.LayoutDashboard,
                isActive: true,
                url: "/dashboard"
            },
            {
                title: "Müşteriler",
                icon: LucideIcons.Users,
                isActive: true,
                expanded: true,
                items: [
                    {
                        title: "Ana Firmalar",
                        icon: LucideIcons.Building2,
                        url: "/parent-companies"
                    },
                    {
                        title: "Firmalar",
                        icon: LucideIcons.Building,
                        url: "/companies"
                    },
                    {
                        title: "Kişiler",
                        icon: LucideIcons.User,
                        url: "/contacts"
                    },
                ]
            },
            {
                title: "Destek Talepleri",
                icon: LucideIcons.TicketCheck,
                isActive: true,
                expanded: true,
                items: [
                    {
                        title: "Tüm Talepler",
                        icon: LucideIcons.ListChecks,
                        url: "/tickets"
                    },
                    {
                        title: "Benim Taleplerim",
                        icon: LucideIcons.UserCheck,
                        url: "/tickets/my-ticket"
                    },
                    {
                        title: "Bekleyen Talepler",
                        icon: LucideIcons.Clock,
                        url: "/tickets/pending-ticket"
                    },
                    {
                        title: "Çözülen Talepler",
                        icon: LucideIcons.CheckCircle,
                        url: "/tickets/resolved-ticket"
                    }
                ]
            },
            {
                title: "Departmanlar",
                icon: LucideIcons.LayoutDashboard, // Genel departmanlar için uygun bir ikon
                isActive: true,
                expanded: true,
                items: [
                  {
                    title: "Çağrı Merkezi",
                    icon: LucideIcons.Headphones, // Çağrı merkezi için kulaklık ikonu mantıklı
                    url: "/call-center"
                  },
                  {
                    title: "Arge",
                    icon: LucideIcons.FlaskConical, // AR-GE için laboratuvar şişesi ikonu uygun
                    url: "/arge"
                  },
                  {
                    title: "ERP",
                    icon: LucideIcons.Server, // ERP sistemleri genellikle sunucu tabanlıdır
                    url: "/erp"
                  },
                  {
                    title: "Operasyon Destek",
                    icon: LucideIcons.LifeBuoy, // Destek hizmetleri için can simidi ikonu anlamlı
                    url: "/operationdesk"
                  },
                  {
                    title: "Yerinde Servis",
                    icon: LucideIcons.Truck, // Yerinde servis için araç (kamyon) ikonu kullanılabilir
                    url: "/inhouse"
                  },
                  {
                    title: "Yazılım",
                    icon: LucideIcons.Code, // Yazılım departmanı için kod ikonu en uygunu
                    url: "/software"
                  }
                ]
              },              
            {
                title: "Ayarlar",
                icon: LucideIcons.Settings,
                isActive: true,
                expanded: true,
                items: [
                    {
                        title: "Kullanıcı Ayarları",
                        icon: LucideIcons.UserCog,
                        url: "/users"
                    },
                    {
                        title: "Grup Kategori Yönetimi",
                        icon: LucideIcons.FolderTree,
                        url: "/categories"
                    },
                    {
                        title: "Flow Firmaları",
                        icon: LucideIcons.Building,
                        url: "/flow-companies"
                    }
                ]
            }
        ];
        return items;
    }, []);

    useEffect(() => {
        const storedUserData = localStorage.getItem(`userData_${tenantId}`);
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, [tenantId]);

    const baseData = useMemo(() => ({
        user: {
            name: userData.name,
            email: userData.email,
            avatar: `${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/avatar.png`,
        },
        teams: [
            {
                name: "robotPOS Enterprise",
                href: `${process.env.PROJECT_BASE_URL || ''}/franchisemanager/${tenantId}`,
                logo: `${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/Audit.png`,
                plan: "Support Desk Manager",
                className: "bg-blue-200",
            }
        ],
        projects: [],
    }), [userData, tenantId]);

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={baseData.teams} />
            </SidebarHeader>
            <SidebarContent>
                <nav className="flex flex-col gap-4">
                    <NavMain items={navItems} />
                </nav>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={baseData.user} />
            </SidebarFooter>
        </Sidebar>
    );
}