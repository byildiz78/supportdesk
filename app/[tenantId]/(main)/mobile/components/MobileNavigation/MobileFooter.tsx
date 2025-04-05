"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
    Home, 
    Bell, 
    Menu as MenuIcon,
    LoaderIcon
} from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import MobileFilter from "../MobileFilter/filter";
import { useNotificationStore } from "@/stores/notification-store";

interface MobileFooterProps {
    onNotificationsClick: () => void;
}

interface NavItem {
    name: string;
    label: string;
    icon: any;
    href: string;
}

const navItems: NavItem[] = [
    {
        name: "home",
        label: "Ana Sayfa",
        icon: Home,
        href: "/[tenantId]"
    },
    {
        name: "notifications",
        label: "Bildirimler",
        icon: Bell,
        href: "/[tenantId]/notifications"
    },
    {
        name: "menu",
        label: "Menü",
        icon: MenuIcon,
        href: "/[tenantId]/menu"
    },
];

export default function MobileFooter({ onNotificationsClick }: MobileFooterProps) {
    const pathname = usePathname();
    const router = useRouter();
    const tenantId = pathname?.split('/')[1] || "";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loadingPath, setLoadingPath] = useState<string | null>(null);
    const { unreadCount } = useNotificationStore();

    // Prefetch all pages
    useEffect(() => {
        navItems.forEach(item => {
            const fullPath = item.href.replace("[tenantId]", tenantId);
            router.prefetch(fullPath);
        });
    }, [router, tenantId]);

    const handleItemClick = (item: NavItem) => {
        if (item.name === "menu") {
            setIsMenuOpen(true);
            return;
        }

        if (item.name === "notifications") {
            onNotificationsClick();
            return;
        }

        if (item.href) {
            const fullPath = item.href.replace("[tenantId]", tenantId);
            setLoadingPath(fullPath);
            router.push(fullPath);
            
            // Remove loading after transition starts
            setTimeout(() => setLoadingPath(null), 300);
        }
    };

    const isHomePage = pathname === `/${tenantId}`;

    return (
        <>
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-40">
                <nav className="flex items-center justify-around">
                    <div className="flex w-full max-w-md mx-auto">
                        {navItems.map((item) => {
                            const fullPath = item.href.replace("[tenantId]", tenantId);
                            const isActive = item.name !== "menu" && pathname === fullPath;
                            const isLoading = loadingPath === fullPath;
                            
                            return (
                                <button
                                    key={item.href}
                                    disabled={isLoading}
                                    onClick={() => handleItemClick(item)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-2 px-4",
                                        "transition-opacity duration-200",
                                        "flex-1",
                                        isActive && "text-primary",
                                        isLoading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center justify-center h-10">
                                        {isLoading ? (
                                            <LoaderIcon className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <div className="relative">
                                                <item.icon className="h-6 w-6" />
                                                {item.name === "notifications" && unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-xs font-small mt-1">
                                            {item.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </nav>
                {!isHomePage && (
                    <MobileFilter 
                        open={false} 
                        onOpenChange={() => {}}
                    />
                )}
            </div>
        </>
    );
}
