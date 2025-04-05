"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp, FaChartBar, FaTicketAlt, FaThermometerHalf, FaBuilding, FaUser, FaChartLine, FaUserCheck, FaWrench, FaServer, FaToolbox } from "react-icons/fa";
import { 
  FaLaptop, FaTicketAlt as FaTicket, FaListAlt, FaUserCheck as FaUserCheckIcon, 
  FaClock, FaCheckCircle, FaBuilding as FaBuildingIcon, FaHeadphones, 
  FaFlask, FaLifeRing, FaTruck, FaCode, FaChartBar as FaChartBarIcon,
  FaCog, FaBuilding as FaBuilding2, FaUser as FaUserIcon, FaUserCog, FaFolder 
} from "react-icons/fa";
import { IconType } from 'react-icons';
import { TbTicketOff } from "react-icons/tb";

interface NavItem {
    title: string;
    icon?: LucideIcons.LucideIcon | IconType;
    isActive?: boolean;
    expanded?: boolean;
    url?: string;
    component?: React.ComponentType<any>;
    items?: NavItem[];
    onClick?: () => void;
    className?: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const tenantId = pathname?.split("/")[1] || "";
    const [userData, setUserData] = useState({ name: "", email: "", usercategory: "", userrole: "" });

    React.useEffect(() => {
        const storedUserData = localStorage.getItem(`userData_${tenantId}`);
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, [tenantId]);

    const navItems = useMemo(() => {
        const items = [
            {
                title: "Dashboard",
                icon: FaLaptop,
                isActive: true,
                url: "/dashboard"
            },
            {
                title: "Whatsapp",
                icon: FaWhatsapp,
                isActive: true,
                url: "/whatsapp",
                className: "mt-2 mb-2 py-3 bg-green-100 hover:bg-green-200 rounded-md text-green-800 font-medium transition-colors"
            },
            {
                title: "Destek Talepleri",
                icon: FaTicket,
                isActive: true,
                expanded: true,
                items: [
                    {
                        title: "Tüm Talepler",
                        icon: FaListAlt,
                        url: "/tickets"
                    },
                    {
                        title: "Atanmamış Talepler",
                        icon: TbTicketOff ,
                        url: "/tickets/unassigned-ticket"
                    },
                    {
                        title: "Benim Taleplerim",
                        icon: FaUserCheckIcon,
                        url: "/tickets/my-ticket"
                    },
                    {
                        title: "Bekleyen Talepler",
                        icon: FaClock,
                        url: "/tickets/pending-ticket"
                    },
                    {
                        title: "Çözülen Talepler",
                        icon: FaCheckCircle,
                        url: "/tickets/resolved-ticket"
                    }
                ]
            },
            {
                title: "Departmanlar",
                icon: FaBuildingIcon, // Genel departmanlar için uygun bir ikon
                isActive: true,
                expanded: false,
                items: [
                    {
                        title: "Çağrı Merkezi",
                        icon: FaHeadphones, // Çağrı merkezi için kulaklık ikonu mantıklı
                        url: "/call-center"
                    },
                    {
                        title: "Arge",
                        icon: FaFlask, // AR-GE için laboratuvar şişesi ikonu uygun
                        url: "/arge"
                    },
                    {
                        title: "ERP",
                        icon: FaServer, // ERP sistemleri genellikle sunucu tabanlıdır
                        url: "/erp"
                    },
                    {
                        title: "Operasyon Destek",
                        icon: FaLifeRing, // Destek hizmetleri için can simidi ikonu anlamlı
                        url: "/operationdesk"
                    },
                    {
                        title: "Yerinde Servis",
                        icon: FaTruck, // Yerinde servis için araç (kamyon) ikonu kullanılabilir
                        url: "/inhouse"
                    },
                    {
                        title: "Teknik Servis",
                        icon: FaWrench, // Teknik servis için araç (kamyon) ikonu kullanılabilir
                        url: "/technical-service"
                    },
                    {
                        title: "Donanım",
                        icon: FaToolbox, // Donanım için uygun ikon
                        url: "/hardware"
                    },
                    {
                        title: "Kurulum",
                        icon: FaServer, // Kurulum için sunucu ikonu daha uygun
                        url: "/setup"
                    },
                    {
                        title: "Yazılım",
                        icon: FaCode, // Yazılım departmanı için kod ikonu en uygunu
                        url: "/software"
                    }
                ]
            },
            {
                title: "Raporlar",
                icon: FaChartBarIcon,
                isActive: true,
                expanded: false,
                items: [
                    {
                        title: "Tüm Ticketlar",
                        icon: FaTicketAlt,
                        url: "/reports/alltickets"
                    },
                    {
                        title: "Isı Haritası",
                        icon: FaThermometerHalf,
                        url: "/reports/heatmap"
                    },
                    {
                        title: "Isı Haritası-Departman",
                        icon: FaBuilding,
                        url: "/reports/heatmap-department"
                    },
                    {
                        title: "Isı Haritası-Müşteri",
                        icon: FaUser,
                        url: "/reports/heatmap-customer"
                    },
                    {
                        title: "Çözüm Analizi",
                        icon: FaChartBar,
                        url: "/reports/resolution-analysis"
                    },
                    {
                        title: "Online Kullanıcılar",
                        icon: FaUserCheck,
                        url: "/reports/online-users"
                    },
                ]
            },
            {
                title: "Ayarlar",
                icon: FaCog,
                isActive: true,
                expanded: false,
                items: [
                    {
                        title: "Ana Firmalar",
                        icon: FaBuilding2,
                        url: "/parent-companies"
                    },
                    {
                        title: "Firmalar",
                        icon: FaBuildingIcon,
                        url: "/companies"
                    },
                    {
                        title: "Kişiler",
                        icon: FaUserIcon,
                        url: "/contacts"
                    },
                    {
                        title: "Kullanıcı Ayarları",
                        icon: FaUserCog,
                        url: "/users"
                    },
                    {
                        title: "Grup Kategori Yönetimi",
                        icon: FaFolder,
                        url: "/categories"
                    },
                    {
                        title: "Flow Firmaları",
                        icon: FaBuildingIcon,
                        url: "/flow-companies"
                    }
                ]
            }
        ];

        return items.filter(item => {
            if (item.title === "Ayarlar") {
                return userData.userrole && (userData.userrole == "admin" || userData.userrole == "manager");
            }
            return true;
        });
    }, [userData.userrole]);

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