"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MobileDashboard from "./components/MobileDashboard/page";
import MobileFooter from "./components/MobileNavigation/MobileFooter";
import { useTicketStore } from "@/stores/ticket-store";
import { Toaster } from "@/components/ui/toaster";
import { MobileMenu } from "./components/MobileNavigation/MobileMenu";
import { useNotificationStore } from "@/stores/notification-store";

export default function MobilePage() {
    const pathname = usePathname();
    const tenantId = pathname?.split('/')[1] || "";
    const { fetchNotifications } = useNotificationStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // İlk yükleme
        fetchNotifications();

        // Her 1 dakikada bir yenile
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // React Native WebView iletişimi
    useEffect(() => {   
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loginSuccess',
                userId: "1297"
            }));
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1 pb-20">
                <MobileDashboard />
            </main>
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <Toaster />
        </div>
    );
}