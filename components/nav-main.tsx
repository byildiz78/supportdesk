"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useParams } from "next/navigation"
import { useTabStore } from "@/stores/tab-store"
import { useState, useMemo } from "react"
import { useFilterStore } from "@/stores/filters-store"
import { toZonedTime } from "date-fns-tz"
import { useSettingsStore } from "@/stores/settings-store"
import { addDays } from "date-fns"
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import axios from "@/lib/axios";
import { FaSearch } from "react-icons/fa";

interface NavItem {
    title: string;
    icon?: LucideIcon;
    isActive?: boolean;
    expanded?: boolean;
    securityLevel?: string;
    displayOrder?: number;
    url?: string;
    component?: React.ComponentType<any>;
    items?: NavItem[];
    onClick?: () => void;
    components?: any;
}

const ReportItemWithTooltip = ({ title, icon: Icon }: { title: string; icon: LucideIcon }) => (
    <TooltipProvider delayDuration={300}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-2 w-full relative group">
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <span className="flex-1 truncate text-sm group-hover:text-clip group-hover:whitespace-normal">
                        {title}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent 
                side="right" 
                className="max-w-[300px] break-words z-50 bg-popover shadow-md px-3 py-1.5 text-sm rounded-md"
                sideOffset={5}
                alignOffset={-5}
            >
                {title}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)

const RecursiveMenuItem = ({
    item,
    level = 0,
    handleTabChange,
}: {
    item: NavItem;
    level?: number;
    handleTabChange: (id: string, title: string, url?: string, component?: React.ComponentType<any>) => void;
}) => {
    const params = useParams();
    const tenantId = params?.tenantId;
    const hasSubItems = item.items && item.items.length > 0;
    const isInitiallyOpen = typeof item.expanded !== 'undefined' ? item.expanded : item.isActive;
    
    // Özel "Ticket Ara" nav item'ı için render mantığı
    if (item.title === "Ticket Ara" && item.components) {
        const { Input, Button } = item.components;
        const [searchTerm, setSearchTerm] = useState("");
        const [isSearching, setIsSearching] = useState(false);
        const router = useRouter();
        
        const handleSearch = async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!searchTerm.trim()) {
                toast({
                    title: "Arama terimi gerekli",
                    description: "Lütfen bir arama terimi girin",
                    variant: "destructive"
                });
                return;
            }

            setIsSearching(true);

            try {
                const response = await axios.get(`/api/main/search?searchTerm=${encodeURIComponent(searchTerm)}`);
                const data = response.data;

                if (data.success) {
                    if (data.data.length > 0) {
                        // Tab açma mantığı
                        const tabId = "Ticket Ara";
                        const { tabs, addTab, setActiveTab, removeTab } = useTabStore.getState();
                        const isTabAlreadyOpen = tabs.some(tab => tab.id === tabId);
                        
                        // Eğer tab zaten açıksa, önce kaldırıp sonra yeniden ekleyelim
                        if (isTabAlreadyOpen) {
                            removeTab(tabId);
                        }
                        
                        // Yeni tab ekleyelim
                        addTab({
                            id: tabId,
                            title: "Ticket Ara",
                            lazyComponent: () => import('@/app/[tenantId]/(main)/search/page').then(module => ({
                                default: (props: any) => <module.default {...props} searchTerm={searchTerm} key={Date.now()} />
                            }))
                        });
                        
                        setActiveTab(tabId);
                    } else {
                        toast({
                            title: "Sonuç bulunamadı",
                            description: "Aramanızla eşleşen bilet bulunamadı",
                            variant: "default"
                        });
                    }
                } else {
                    toast({
                        title: "Arama hatası",
                        description: data.message || "Biletler aranırken bir hata oluştu",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error("Arama hatası:", error);
                toast({
                    title: "Arama hatası",
                    description: "Biletler aranırken bir hata oluştu",
                    variant: "destructive"
                });
            } finally {
                setIsSearching(false);
            }
        };
        
        return (
            <div className="w-full px-2 mb-2">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative w-full">
                            {item.icon && <item.icon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                            <Input
                                placeholder="Bilet ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 text-sm pl-8"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-8 px-2" disabled={isSearching}>
                            {isSearching ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <FaSearch className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    if (!hasSubItems) {
        return (
            <div className="w-full">
                <div
                    onClick={() => handleTabChange(item.title, item.title, item.url ? `/${tenantId}/${item.url}` : undefined, item.component)}
                    className={`w-full ${item.className || ''}`}
                >
                    <SidebarMenuButton className="w-full group hover:bg-accent hover:text-accent-foreground">
                        <div className="flex items-center gap-2 w-full">
                            {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                            <span className="flex-1 truncate text-sm">
                                {item.title}
                            </span>
                        </div>
                    </SidebarMenuButton>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Collapsible asChild defaultOpen={isInitiallyOpen} className="group/collapsible w-full">
                <div>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="w-full">
                            {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                            <span className="flex-1 truncate">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="w-full">
                        <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                                <div key={subItem.title} className="w-full">
                                    <RecursiveMenuItem
                                        item={subItem}
                                        level={level + 1}
                                        handleTabChange={handleTabChange}
                                    />
                                </div>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
};

export const NavMain = ({ items }: { items: NavItem[] }) => {
    const { addTab, setActiveTab, tabs, setTabFilter } = useTabStore()
    const {selectedFilter,setFilter} = useFilterStore();
    const [searchQuery, setSearchQuery] = useState("");

    const handleTabChange = (id: string, title: string, url?: string, component?: React.ComponentType<any>) => {
        // Dashboard için özel kontrol
        if (title.toLowerCase() === 'dashboard') {
            setActiveTab('dashboard');
            return;
        }

        const foundedTab = tabs.find(tab => tab.id === id);
        if (foundedTab) {
            setActiveTab(id);
        } else {
            const { settings } = useSettingsStore.getState();
            const daystart = parseInt(settings.find(setting => setting.Kod === "daystart")?.Value || '0');
    
            let startTime: string;
            let endTime: string;
    
            if (daystart === 0) {
                startTime = "00:00";
                endTime = "23:59";
              } else {
                const startHour = daystart.toString().padStart(2, '0');
                startTime = `${startHour}:00`;
                const endHour = ((daystart - 1 + 24) % 24).toString().padStart(2, '0');
                endTime = `${endHour}:59`;
              }
    
              const [startHours, startMinutes] = startTime.split(':').map(Number);
              const [endHours, endMinutes] = endTime.split(':').map(Number);
    
              const defaultFilter = {
                date: {
                    from: toZonedTime(new Date(new Date().setHours(startHours, startMinutes, 0, 0)), 'Europe/Istanbul'),
                    to: toZonedTime(
                        daystart === 0 
                            ? new Date(new Date().setHours(endHours, endMinutes, 59, 999))
                            : addDays(new Date(new Date().setHours(endHours, endMinutes, 59, 999)), 1), 
                        'Europe/Istanbul'
                    )
                },
                branches: selectedFilter.branches,
                selectedBranches: selectedFilter.selectedBranches,
                appliedAt: Date.now()
            };
    
            addTab({
                id,
                title,
                url,
                filter: defaultFilter,
                lazyComponent: component 
                    ? async () => ({ default: component })
                    : async () => {
                        const parts = url?.split('/').filter(Boolean) || [];
                        const cleanUrl = parts.slice(1).join('/');
                        return import(`@/app/[tenantId]/(main)/${cleanUrl}/page`);
                    }
            });
            
            setTabFilter(id, defaultFilter);
            setFilter(defaultFilter);
        }
    }
    const searchItems = (items: NavItem[], query: string): NavItem[] => {
        return items.map(item => {
            const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase());
            const hasMatchingChildren = item.items && searchItems(item.items, query).length > 0;

            if (matchesSearch || hasMatchingChildren) {
                return {
                    ...item,
                    items: item.items ? searchItems(item.items, query) : undefined,
                    expanded: query ? true : item.expanded
                };
            }
            return null;
        }).filter(Boolean) as NavItem[];
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        return searchItems(items, searchQuery);
    }, [items, searchQuery]);

    return (
        <SidebarGroup>
            <div className="px-2 mb-4">
                <input
                    type="text"
                    placeholder="Menüde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
                />
            </div>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu className="w-full">
                {filteredItems.map((item) => (
                    <div key={item.title} className={`w-full ${item.className || ''}`}>
                        <RecursiveMenuItem
                            item={item}
                            handleTabChange={handleTabChange}
                        />
                    </div>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
};

NavMain.displayName = 'NavMain';