"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaLaptop, FaTicketAlt as FaTicket, FaListAlt, FaUserCheck as FaUserCheckIcon,
  FaClock, FaCheckCircle, FaBuilding as FaBuildingIcon, FaHeadphones,
  FaFlask, FaServer, FaLifeRing, FaTruck, FaCode, FaChartBar as FaChartBarIcon,
  FaCog, FaBuilding as FaBuilding2, FaUser as FaUserIcon, FaUserCog, FaFolder,
  FaWhatsapp, FaChartBar, FaTicketAlt, FaThermometerHalf, FaBuilding, FaUser, FaChartLine, FaUserCheck,
  FaBell,
  FaToolbox,
  FaWrench
} from "react-icons/fa";
import { TbTicketOff } from "react-icons/tb";
import { ChevronDown, ChevronRight, X, ArrowLeft, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconType } from "react-icons";
import { NotificationBell } from "../../components/MobileDashboard/components/NotificationBell";
import { useTicketStore } from "@/stores/ticket-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useTheme } from "@/providers/theme-provider";

interface NavItem {
  title: string;
  icon?: IconType;
  isActive?: boolean;
  expanded?: boolean;
  url?: string;
  items?: NavItem[];
  className?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantId = pathname?.split("/")[1] || "";
  const [userData, setUserData] = React.useState({ name: "", email: "", usercategory: "", userrole: "" });
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({
    "Destek Talepleri": true,
    "Departmanlar": false,
    "Raporlar": false,
    "Ayarlar": false
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const { unreadCount } = useNotificationStore();
  const { fetchNotifications } = useTicketStore();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const storedUserData = localStorage.getItem(`userData_${tenantId}`);
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [tenantId]);

  React.useEffect(() => {
    // İlk yükleme
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const navItems: NavItem[] = React.useMemo(() => {
    const items = [
      {
        title: "Dashboard",
        icon: FaLaptop,
        isActive: true,
        url: "/"
      },
      {
        title: "Whatsapp",
        icon: FaWhatsapp,
        isActive: true,
        url: "/mobile/whatsapp",
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
            url: "/mobile/tickets"
          },
          {
            title: "Atanmamış Talepler",
            icon: TbTicketOff,
            url: "/mobile/unassigned-ticket"
          },
          {
            title: "Benim Taleplerim",
            icon: FaUserCheckIcon,
            url: "/mobile/my-ticket"
          },
          {
            title: "Bekleyen Talepler",
            icon: FaClock,
            url: "/mobile/pending-ticket"
          },
          {
            title: "Çözülen Talepler",
            icon: FaCheckCircle,
            url: "/mobile/resolved-ticket"
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
            url: "/mobile/call-center"
          },
          {
            title: "Arge",
            icon: FaFlask, // AR-GE için laboratuvar şişesi ikonu uygun
            url: "/mobile/arge"
          },
          {
            title: "ERP",
            icon: FaServer, // ERP sistemleri genellikle sunucu tabanlıdır
            url: "/mobile/erp"
          },
          {
            title: "Operasyon Destek",
            icon: FaLifeRing, // Destek hizmetleri için can simidi ikonu anlamlı
            url: "/mobile/operationdesk"
          },
          {
            title: "Yerinde Servis",
            icon: FaTruck, // Yerinde servis için araç (kamyon) ikonu kullanılabilir
            url: "/mobile/inhouse"
          },
          {
            title: "Teknik Servis",
            icon: FaWrench, // Teknik servis için araç (kamyon) ikonu kullanılabilir
            url: "/mobile/technical-service"
          },
          {
            title: "Donanım",
            icon: FaToolbox, // Donanım için uygun ikon
            url: "/mobile/hardware"
          },
          {
            title: "Kurulum",
            icon: FaServer, // Kurulum için sunucu ikonu daha uygun
            url: "/mobile/setup"
          },
          {
            title: "Yazılım",
            icon: FaCode, // Yazılım departmanı için kod ikonu en uygunu
            url: "/mobile/software"
          }
        ]
      },
      // {
      //   title: "Raporlar",
      //   icon: FaChartBarIcon,
      //   isActive: true,
      //   expanded: false,
      //   items: [
      //     {
      //       title: "Tüm Ticketlar",
      //       icon: FaTicketAlt,
      //       url: "/reports/alltickets"
      //     },
      //     {
      //       title: "Isı Haritası",
      //       icon: FaThermometerHalf,
      //       url: "/reports/heatmap"
      //     },
      //     {
      //       title: "Isı Haritası-Departman",
      //       icon: FaBuilding,
      //       url: "/reports/heatmap-department"
      //     },
      //     {
      //       title: "Isı Haritası-Müşteri",
      //       icon: FaUser,
      //       url: "/reports/heatmap-customer"
      //     },
      //     {
      //       title: "Çözüm Analizi",
      //       icon: FaChartBar,
      //       url: "/reports/resolution-analysis"
      //     },
      //     {
      //       title: "Online Kullanıcılar",
      //       icon: FaUserCheck,
      //       url: "/reports/online-users"
      //     },
      //   ]
      // },
      // {
      //   title: "Ayarlar",
      //   icon: FaCog,
      //   isActive: true,
      //   expanded: false,
      //   items: [
      //     {
      //       title: "Ana Firmalar",
      //       icon: FaBuilding2,
      //       url: "/parent-companies"
      //     },
      //     {
      //       title: "Firmalar",
      //       icon: FaBuildingIcon,
      //       url: "/companies"
      //     },
      //     {
      //       title: "Kişiler",
      //       icon: FaUserIcon,
      //       url: "/contacts"
      //     },
      //     {
      //       title: "Kullanıcı Ayarları",
      //       icon: FaUserCog,
      //       url: "/users"
      //     },
      //     {
      //       title: "Grup Kategori Yönetimi",
      //       icon: FaFolder,
      //       url: "/categories"
      //     },
      //     {
      //       title: "Flow Firmaları",
      //       icon: FaBuildingIcon,
      //       url: "/flow-companies"
      //     }
      //   ]
      // }
    ];

    return items.filter(item => {
      if (item.title === "Ayarlar") {
        return userData.userrole && (userData.userrole === "admin" || userData.userrole === "manager");
      }
      return true;
    });
  }, [userData.userrole]);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleNavigation = (url: string) => {
    const fullUrl = `/${tenantId}${url}`;
    router.push(fullUrl);
    onClose();
  };

  const menuVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  // Render menu items recursively
  const renderItems = (items: NavItem[]) => {
    return items.map((item, index) => {
      const isCurrentExpanded = expandedItems[item.title] || false;
      const hasSubItems = item.items && item.items.length > 0;
      const isActive = pathname === `/${tenantId}${item.url || ""}`;

      return (
        <div key={`${item.title}-${index}`} className="mb-1">
          {hasSubItems ? (
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between px-2 py-6",
                  isCurrentExpanded ? "bg-muted" : "",
                  item.className
                )}
                onClick={() => toggleExpand(item.title)}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span className="text-base font-medium">{item.title}</span>
                </span>
                {isCurrentExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {isCurrentExpanded && hasSubItems && (
                <div className="ml-6 pl-2 border-l-2 border-muted">
                  {item.items?.map((subItem, subIndex) => (
                    <Button
                      key={`${subItem.title}-${subIndex}`}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-2 py-5",
                        pathname === `/${tenantId}${subItem.url || ""}` ? "bg-muted" : ""
                      )}
                      onClick={() => handleNavigation(subItem.url || "")}
                    >
                      <span className="flex items-center gap-2">
                        {subItem.icon && <subItem.icon className="h-4 w-4" />}
                        <span className="text-sm">{subItem.title}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-2 py-6",
                isActive ? "bg-muted" : "",
                item.className
              )}
              onClick={() => handleNavigation(item.url || "")}
            >
              <span className="flex items-center gap-2">
                {item.icon && <item.icon className="h-5 w-5" />}
                <span className="text-base font-medium">{item.title}</span>
              </span>
            </Button>
          )}
        </div>
      );
    });
  };

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        isOpen ? "block" : "hidden"
      )}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={{
        open: { opacity: 1 },
        closed: { opacity: 0 }
      }}
    >
      <motion.div
        className="fixed left-0 top-0 h-full w-[85%] max-w-[350px] bg-background shadow-lg"
        variants={menuVariants}
      >
        <div className="flex h-full flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={`${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/Audit.png`}
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="font-semibold">{isNotificationsOpen ? "Bildirimler" : "Support"}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isNotificationsOpen && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="relative"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleNotifications}
                    className="relative"
                  >
                    <FaBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </>
              )}
              {isNotificationsOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseNotifications}
                  className="mr-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {isNotificationsOpen ? (
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-950">
              <NotificationBell
                onClose={handleCloseNotifications}
                hideHeader={true}
              />
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              {renderItems(navItems)}
            </ScrollArea>
          )}

          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <FaUser className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{userData.name || "Kullanıcı"}</p>
                <p className="text-xs text-muted-foreground">{userData.email || "kullanici@robotpos.com"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
