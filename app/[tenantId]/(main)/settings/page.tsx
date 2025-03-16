"use client";

import { motion } from "framer-motion";
import { Users, Store, FileText, Bell, List, Shield, Database, Settings, Workflow, Lock, PieChart, HandCoins, Settings2, FileDown, FileUp, Loader2, FileJson, Check, X, Group, Upload, Columns, Grid, MonitorUp, HousePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTabStore } from "@/stores/tab-store";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AuthForm } from "./components/auth-form";



export default function SettingsPage() {
  const tabStore = useTabStore();
  const { addTab, setActiveTab } = tabStore;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    [key: string]: {
      truncate: 'pending' | 'running' | 'completed' | 'error';
      schema: 'pending' | 'running' | 'completed' | 'error';
      data: 'pending' | 'running' | 'completed' | 'error';
      error?: string;
    };
  }>({});
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSettingClick = (setting: any) => {
    if (setting.route && setting.tabId) {
      // Check if tab is already open
      const isTabOpen = tabStore.tabs.some(tab => tab.id === setting.tabId);
      
      if (!isTabOpen) {
        addTab({
          id: setting.tabId,
          title: setting.title,
          lazyComponent: () => import(`./${setting.route}/page`)
        });
      }
      
      setActiveTab(setting.tabId);
    }
  };

  const settings = [
    {
      title: "Kullanıcı Listesi",
      description: "Kullanıcı ekleme ve güncelleme işlemlerini yapabilirsiniz",
      icon: Users,
      color: "bg-blue-500 dark:bg-blue-600",
      route: "users",
      tabId: "users-list"
    },
    {
      title: "Firma Listesi",
      description: "Firma ekleme ve güncelleme işlemlerini yapabilirsiniz",
      icon: HousePlus,
      color: "bg-green-500 dark:bg-green-600",
      route: "companies",
      tabId: "companies-list"
    },
    // { Yeni Yapıyla Birlikte Companies İçerisine Taşındı.
    //   title: "Kurulum Oluştur",
    //   description: "Kurulum oluşturma ve güncelleme işlemlerini yapabilirsiniz",
    //   icon: MonitorUp,
    //   color: "bg-purple-500 dark:bg-purple-600",
    //   route: "setup",
    //   tabId: "setup"
    // },
    // {
    //   title: "Rapor Kolon Özellikleri",
    //   description: "Raporların kolonlarını şekillendirebilirsiniz",
    //   icon: Database,
    //   color: "bg-indigo-500 dark:bg-indigo-600",
    //   route: "report-columns",
    //   tabId: "report-columns-list",
    //   comingSoon: true
    // },
    // {
    //   title: "Rapor Seti İşlemleri",
    //   description: "Rapor seti oluşturma ve yükleme işlemlerini gerçekleştirebilirsiniz",
    //   icon: Settings2,
    //   color: "bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700",
    //   children: [
    //     {
    //       title: "Rapor Seti Oluştur",
    //       description: "Projenin çalışmasını sağlayan tabloları JSON olarak dışa aktarın",
    //       icon: FileDown,
    //       color: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600",
    //       action: "export",
    //     },
    //     {
    //       title: "Rapor Seti Yükle",
    //       description: "Dışa aktarılmış rapor setini sisteme yükleyin",
    //       icon: FileUp,
    //       color: "bg-gradient-to-r from-blue-400 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-600",
    //       route: "report-creation/import",
    //       tabId: "report-creation-import",
    //     },
    //     {
    //       title: "AG Grid Raporları Yükle",
    //       description: "Mevcut Db üzerinden AG Grid rapor setini sisteme yükleyin",
    //       icon: Grid,
    //       color: "bg-gradient-to-r from-purple-400 to-violet-500 text-white hover:from-purple-500 hover:to-violet-600",
    //       route: "aggrid-report-creation/import",
    //       tabId: "aggrid-report-creation-import",
    //     },
    //     {
    //       title: "Eksik Kolonları Yükle",
    //       description: isCheckingColumns ? "Kontrol ediliyor..." : "efr_Users & efr_Branchs tablolarında eksik kolonları yükleyin",
    //       icon: isCheckingColumns ? Loader2 : Columns, 
    //       color: "bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600",
    //       action: "columns",
    //     }
    //   ]
    // }
  ];

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md px-4"
        >
          <Card className="relative overflow-hidden border-neutral-200/20 dark:border-neutral-800/20">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background" />
            <div className="absolute inset-0 bg-grid-primary/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            
            <div className="relative p-8 backdrop-blur-sm">
              <AuthForm 
                onAuthenticate={(password) => {
                  if (password === currentTime) {
                    setIsAuthenticated(true);
                    setError("");
                  } else {
                    setError("Yanlış şifre!");
                  }
                }}
                error={error}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full w-full">
        <div className="h-full w-full bg-gradient-to-br from-background via-purple-50/30 dark:via-purple-950/30 to-background">
          <div className="p-8 w-full space-y-8">
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground">Ayarlar</h1>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.map((setting, index) => {
                const Icon = setting.icon;
                if (setting.children) {
                  return (
                    <div key={index} className="col-span-1 md:col-span-2 lg:col-span-1">
                      <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:bg-accent/50">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`p-3 rounded-lg ${setting.color}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{setting.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {setting.children.map((child, childIndex) => (
                            <div key={childIndex}>
                              {child.action === 'export' && isExporting ? (
                                <motion.div
                                  initial={false}
                                  animate={{ 
                                    height: isExporting ? "auto" : 0,
                                    opacity: isExporting ? 1 : 0
                                  }}
                                  transition={{
                                    height: { duration: 0.3 },
                                    opacity: { duration: 0.2 }
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 rounded-lg bg-card">
                                    <div className="flex items-center gap-4">
                                      <div className="relative shrink-0">
                                        <motion.div
                                          animate={{ 
                                            rotate: [0, 360],
                                          }}
                                          transition={{ 
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                          }}
                                        >
                                          <div className="relative">
                                            <Loader2 className="h-8 w-8 text-primary" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <FileJson className="h-4 w-4 text-primary" />
                                            </div>
                                          </div>
                                        </motion.div>
                                      </div>
                                      <div className="flex-1 relative h-6 overflow-hidden">
                                        {exportTables.map((table, index) => (
                                          <motion.div
                                            key={table.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ 
                                              opacity: index === currentTableIndex ? 1 : 0,
                                              x: index === currentTableIndex ? 0 : index < currentTableIndex ? -20 : 20,
                                              display: Math.abs(index - currentTableIndex) <= 1 ? 'flex' : 'none'
                                            }}
                                            transition={{ 
                                              type: "spring",
                                              stiffness: 300,
                                              damping: 25
                                            }}
                                            className={`absolute inset-0 items-center ${
                                              index === currentTableIndex ? 'text-primary font-medium' : 'text-muted-foreground'
                                            }`}
                                          >
                                            <span className="text-sm whitespace-nowrap">{table.description}</span>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={false}
                                  animate={{ 
                                    height: isExporting ? 0 : "auto",
                                    opacity: isExporting ? 0 : 1
                                  }}
                                  transition={{
                                    height: { duration: 0.3 },
                                    opacity: { duration: 0.2 }
                                  }}
                                  className="overflow-hidden"
                                >
                                  <Button 
                                    className={`w-full h-auto py-4 ${child.color} transition-all duration-300 shadow-sm hover:shadow-lg`}
                                    onClick={() => handleSettingClick(child)}
                                    disabled={isExporting}
                                  >
                                    <div className="flex flex-col items-center gap-3 py-2">
                                      <child.icon className="h-8 w-8" />
                                      <div className="space-y-1 text-center">
                                        <div className="font-medium">{child.title}</div>
                                        <p className="text-xs opacity-90">{child.description}</p>
                                      </div>
                                    </div>
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  );
                } else {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => !setting.comingSoon && handleSettingClick(setting)}
                      className={`${setting.comingSoon ? 'opacity-60' : 'cursor-pointer'}`}
                    >
                      <Card className={`p-6 transition-all duration-300 ${setting.comingSoon ? 'bg-muted' : 'hover:shadow-lg hover:bg-accent/50'}`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-3 rounded-lg ${setting.color}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{setting.title}</h3>
                              {setting.comingSoon && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Yakında</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          disabled={setting.comingSoon}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>{setting.comingSoon ? 'Yakında' : 'Giriş yap'}</span>
                          </div>
                        </Button>
                      </Card>
                    </motion.div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {isImporting && (
        <div className="p-4 rounded-lg bg-card">
          <div className="space-y-4">
            {Object.entries(importProgress).map(([table, status]) => (
              <div key={table} className="space-y-2">
                <div className="font-medium text-sm">{table}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['truncate', 'schema', 'data'] as const).map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "text-xs px-2 py-1 rounded flex items-center gap-2",
                        status[step] === 'pending' && "bg-muted text-muted-foreground",
                        status[step] === 'running' && "bg-blue-100 text-blue-700",
                        status[step] === 'completed' && "bg-green-100 text-green-700",
                        status[step] === 'error' && "bg-red-100 text-red-700"
                      )}
                    >
                      {step === 'truncate' && "Tablo Temizleniyor"}
                      {step === 'schema' && "Şema Güncelleniyor"}
                      {step === 'data' && "Veriler Ekleniyor"}
                      {status[step] === 'running' && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {status[step] === 'completed' && (
                        <Check className="h-3 w-3" />
                      )}
                      {status[step] === 'error' && (
                        <X className="h-3 w-3" />
                      )}
                    </div>
                  ))}
                </div>
                {status.error && (
                  <div className="text-xs text-red-600">
                    Hata: {status.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
