"use client";

import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { cn } from "@/lib/utils";
import { 
  X, XCircle, Home, Settings, Users, Bell, Search, Mail, 
  FileText, Code, Database, Bot, MessageSquare, 
  BarChart, PieChart, LineChart, Table, Folder,
  FileJson, FileSpreadsheet, Filter, List
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Shadcn'deki aynı arayüzleri koruyalım
const CustomTabs = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  // Aktif tab indeksini bul
  const childrenArray = React.Children.toArray(children);
  const tabsListChild = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === CustomTabsList
  );
  
  const tabsContentChildren = childrenArray.filter(
    (child) => React.isValidElement(child) && child.type !== CustomTabsList
  );

  // TabsList içindeki TabsTrigger'ları bul
  const tabsList = React.isValidElement(tabsListChild) ? tabsListChild.props.children : [];
  const tabsArray = React.Children.toArray(tabsList).filter(
    (child) => React.isValidElement(child) && child.type === CustomTabsTrigger
  );

  // TabsTrigger'lardan value değerlerini çıkar
  const tabValues = tabsArray.map((tab) => 
    React.isValidElement(tab) ? tab.props.value : null
  ).filter(Boolean);

  // Aktif tab indeksini bul
  const activeIndex = tabValues.indexOf(value);

  return (
    <div
      ref={ref}
      className={cn("h-full flex flex-col", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        if (child.type === CustomTabsList) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab: value,
            onTabChange: onValueChange,
            tabValues
          });
        }
        
        return child;
      })}
    </div>
  );
});
CustomTabs.displayName = "CustomTabs";

// TabsList bileşeni
const CustomTabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    onCloseAll?: () => void;
    activeTab?: string;
    onTabChange?: (value: string) => void;
    tabValues?: string[];
  }
>(({ className, children, onCloseAll, activeTab, onTabChange, tabValues, ...props }, ref) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const prevChildrenLength = React.useRef(0);

  React.useEffect(() => {
    const childrenArray = React.Children.toArray(children);
    if (childrenArray.length > prevChildrenLength.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
    prevChildrenLength.current = childrenArray.length;
  }, [children]);

  // Mouse wheel için yatay scroll
  const handleWheel = React.useCallback((e: WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  React.useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('wheel', handleWheel, { passive: false });
      return () => current.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
    <div 
      ref={ref}
      className={cn(
        "h-12 rounded-lg bg-muted/20 p-1 text-muted-foreground w-full",
        "border border-border/40 shadow-md backdrop-blur-md",
        "flex items-center justify-between",
        className
      )}
      {...props}
    >
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef} 
          className="w-[calc(90vw-20rem)] overflow-x-auto overflow-y-hidden
            [&::-webkit-scrollbar]:h-1.5
            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-transparent
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80"
        >
          <div className="flex items-center gap-1">
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child) || child.type !== CustomTabsTrigger) return null;
              
              const isActive = child.props.value === activeTab;
              const index = tabValues?.indexOf(child.props.value) ?? -1;
              
              return React.cloneElement(child as React.ReactElement<any>, {
                isSelected: isActive,
                tabIndex: index,
                onClick: () => onTabChange?.(child.props.value)
              });
            })}
          </div>
        </div>
      </div>
      
      {onCloseAll && (
        <div className="flex-shrink-0 border-l border-border/40 pl-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="cursor-pointer p-1.5 rounded-md hover:bg-destructive/10 transition-all duration-200 group"
                  onClick={onCloseAll}
                >
                  <XCircle className="h-4 w-4 text-muted-foreground group-hover:text-destructive group-hover:scale-110 transition-all duration-200" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                <p className="text-xs">Tüm açık tabları kapat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
});
CustomTabsList.displayName = "CustomTabsList";

// İkon eşleştirme helper fonksiyonu
const getRandomIcon = () => {
  const icons = [
    Home, Settings, Users, Bell, Search, Mail, 
    FileText, Code, Database, Bot, MessageSquare, 
    BarChart, PieChart, LineChart, Table, Folder,
    FileJson, FileSpreadsheet, Filter, List
  ];
  const RandomIcon = icons[Math.floor(Math.random() * icons.length)];
  return RandomIcon;
};

const getTabIcon = (label: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    notifications: <Bell className="w-4 h-4 mr-2" />,
    settings: <Settings className="w-4 h-4 mr-2" />,
    users: <Users className="w-4 h-4 mr-2" />,
    search: <Search className="w-4 h-4 mr-2" />,
    messages: <Mail className="w-4 h-4 mr-2" />,
  };
  return iconMap[label.toLowerCase()];
};

// TabsTrigger bileşeni
const CustomTabsTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    value: string;
    onClose?: () => void;
    icon?: React.ReactNode;
    isSelected?: boolean;
    tabIndex?: number;
    onClick?: () => void;
  }
>(({ className, children, value, onClose, icon, isSelected, tabIndex, onClick, ...props }, ref) => {
  const defaultIcon = typeof children === 'string' ? getTabIcon(children.toString()) : null;
  const tabIcon = icon || defaultIcon;

  // Memoize the random icon component
  const RandomIconComponent = React.useMemo(() => {
    if (tabIcon) return null;
    return getRandomIcon();
  }, [tabIcon]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background",
        "transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected ? "bg-background/95 text-foreground shadow-lg scale-105 border-b-2 border-primary" : "",
        "hover:bg-background/90 hover:text-foreground",
        "hover:scale-102 hover:shadow-md",
        "group cursor-pointer",
        className
      )}
      role="tab"
      aria-selected={isSelected}
      tabIndex={tabIndex}
      onClick={onClick}
      {...props}
    >
      {/* Tab içeriği */}
      <div className="flex items-center space-x-2">
        <div className="transition-transform duration-200 group-hover:scale-110">
          {tabIcon || (RandomIconComponent && <RandomIconComponent className="w-4 h-4 mr-2" />)}
        </div>
        <span className="font-medium">{children}</span>
      </div>

      {/* Kapatma butonu */}
      {onClose && (
        <div className="ml-2 transition-colors duration-200">
          <X
            className="h-4 w-4 text-muted-foreground hover:text-destructive hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
        </div>
      )}

      {/* Aktif tab göstergesi - alt çizgi */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
        "bg-primary/0 transition-all duration-300",
        isSelected ? "bg-primary/100" : ""
      )} />
    </div>
  );
});
CustomTabsTrigger.displayName = "CustomTabsTrigger";

// TabsContent bileşeni
const CustomTabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    value: string;
    activeTab?: string;
  }
>(({ className, children, value, activeTab, ...props }, ref) => {
  const isActive = value === activeTab;
  
  return (
    <div
      ref={ref}
      className={cn(
        "h-full",
        isActive ? "block" : "hidden",
        className
      )}
      role="tabpanel"
      {...props}
    >
      {children}
    </div>
  );
});
CustomTabsContent.displayName = "CustomTabsContent";

// Custom CSS dosyası oluştur
const CustomTabsCSS = () => (
  <style jsx global>{`
    .react-tabs__tab--selected {
      background: var(--background);
      color: var(--foreground);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transform: scale(1.05);
      border-bottom: 2px solid var(--primary);
    }
    
    .react-tabs__tab {
      border: none;
      bottom: 0;
    }
    
    .react-tabs__tab:focus {
      box-shadow: none;
      border-color: transparent;
    }
    
    .react-tabs__tab:focus:after {
      display: none;
    }
    
    .react-tabs__tab-list {
      border-bottom: none;
      margin: 0;
    }
  `}</style>
);

export {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
  CustomTabsContent,
  CustomTabsCSS
};
