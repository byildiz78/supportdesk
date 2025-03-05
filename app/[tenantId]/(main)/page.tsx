"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import { useTabStore } from "@/stores/tab-store";
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { Home as HomeIcon } from 'lucide-react';
import MobilePage from "@/app/[tenantId]/(main)/mobile/page";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardPage = memo(dynamic(() => import('@/app/[tenantId]/(main)/dashboard/page'), {
    loading: () => <div>Loading...</div>,
    ssr: false
}));

export default function MainPage() {
    const { tabs, activeTab, setActiveTab, removeTab, removeAllTabs, renderedComponents, setRenderedComponent } = useTabStore();
    const isMobile = useIsMobile();
    const handleCloseTab = (tabId: string) => {
        if (activeTab === tabId) {
            const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
            if (tabIndex > 0) {
                setActiveTab(tabs[tabIndex - 1].id);
            } else if (tabs.length > 1) {
                setActiveTab(tabs[1].id);
            } else {
                setActiveTab("dashboard");
            }
        }
        removeTab(tabId);
    };

    if(isMobile){
        return <MobilePage />;
    }
    return (
        <div className="flex h-screen overflow-hidden w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-hidden bg-background/80 backdrop-blur-sm border-2 border-border/40/">
                    <div className="h-full p-4 flex gap-2">
                        <div className="flex-1 bg-background/60 backdrop-blur-sm rounded-lg border-2 border-border/40 shadow-lg dark:shadow-slate-900/20 p-4">
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="h-full flex flex-col"
                            >
                                <TabsList className="w-full justify-start" onCloseAll={removeAllTabs}>
                                    <TabsTrigger value="dashboard" icon={<HomeIcon className="w-4 h-4" />}>
                                        Dashboard
                                    </TabsTrigger>
                                    {tabs.map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            onClose={() => handleCloseTab(tab.id)}
                                        >
                                            {tab.title}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div className="flex-1 mt-4 overflow-hidden">
                                    <div 
                                        style={{ 
                                            visibility: activeTab === "dashboard" ? "visible" : "hidden",
                                            height: "100%",
                                            position: activeTab === "dashboard" ? "relative" : "absolute"
                                        }}
                                    >
                                        <DashboardPage />
                                    </div>
                                    {tabs.map((tab) => {
                                        if (!renderedComponents[tab.id]) {
                                            const TabComponent = dynamic(tab.lazyComponent, {
                                                ssr: false
                                            });
                                            setRenderedComponent(tab.id, <TabComponent />);
                                        }
                                        
                                        return (
                                            <div
                                                key={tab.id}
                                                style={{
                                                    visibility: activeTab === tab.id ? "visible" : "hidden",
                                                    height: "100%",
                                                    position: activeTab === tab.id ? "relative" : "absolute",
                                                    width: "100%"
                                                }}
                                            >
                                                {renderedComponents[tab.id]}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
