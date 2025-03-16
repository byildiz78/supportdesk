'use client';

import { useEffect, useState } from "react";
import { User, Shield, Save, X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PersonalInfo } from "./components/personal-info";
import { SecurityInfo } from "./components/security-info";
import { Efr_Users } from "@/pages/api/settings/users/types";
import axios from "@/lib/axios";
import { toast } from "@/components/ui/toast/use-toast";
import { useRouter } from "next/navigation";
import { encrypt } from "@/pages/api/auth/login";
import { useTabStore } from "@/stores/tab-store";
import { useUsersStore } from "@/stores/settings/users/users-store";
import { categoryToNumber, numberToCategory } from "./lib";
import { Efr_Branches } from "@/types/tables";

interface UserFormProps {
  onClose?: () => void;
  data?: Efr_Users;
  branches?: Efr_Branches[];
}

export default function UserForm(props: UserFormProps) {
  const { data, branches = [] } = props;
  const { addUser, updateUser } = useUsersStore();
  const { removeTab, setActiveTab } = useTabStore();
  const [activeTab, setActivesTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Efr_Users>(() => {
    if (data) {
      let categoryValue: number;
      if (typeof data.Category === 'string') {
        categoryValue = categoryToNumber[data.Category] || 1;
      } else if (typeof data.Category === 'number') {
        categoryValue = data.Category;
      } else {
        categoryValue = 1;
      }

      const initialData = {
        ...data,
        Category: categoryValue,
        UserPWD: ""
      };
      return initialData;
    }

    return {
      UserID: "",
      UserName: "",
      Name: "",
      SurName: "",
      PhoneNumber: "",
      EMail: "",
      Schema: "",
      Category: 1,
      IsActive: true,
      UserPWD: ""
    };
  });

  // Update formData when data prop changes
  useEffect(() => {
    if (data) {
      // Category conversion
      let categoryValue: number;
      if (typeof data.Category === 'string') {
        categoryValue = categoryToNumber[data.Category] || 1;
      } else if (typeof data.Category === 'number') {
        categoryValue = data.Category;
      } else {
        categoryValue = 1;
      }
      
      setFormData(prev => ({
        ...prev,
        ...data,
        Category: categoryValue,
        UserPWD: ""
      }));
    }
  }, [data]);

  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  const checkPasswordRules = (password: string) => {
    setPasswordRules({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const validateForm = () => {
    if (!formData.UserName) {
      toast({
        title: "Hata!",
        description: "Kullanıcı adı boş olamaz.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.Name) {
      toast({
        title: "Hata!",
        description: "İsim boş olamaz.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.SurName) {
      toast({
        title: "Hata!",
        description: "Soyisim boş olamaz.",
        variant: "destructive",
      });
      return false;
    }

    // Password check only for new users
    if (!data && !formData.UserPWD) {
      toast({
        title: "Hata!",
        description: "Şifre alanı boş olamaz.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== "security") {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        setActivesTab(tabs[currentIndex + 1].id);
      }
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const dataToSend = {
        ...formData,
        Category: formData.Category
      };

      // Encrypt password if provided
      if (formData.UserPWD) {
        dataToSend.UserPWD = encrypt(formData.UserPWD) || '';
      }

      // API endpoint and method selection
      const endpoint = data
        ? '/api/settings/users/settings_efr_users_update'
        : '/api/settings/users/settings_efr_users_create';

      const response = await (data
        ? axios.put(endpoint, dataToSend)
        : axios.post(endpoint, dataToSend));
      if (response.data.success) {
        // Category mapping
        const categoryMap: { [key: number]: string } = {
          1: 'Standart',
          2: 'Çoklu Şube',
          3: 'Bölge Sorumlusu',
          4: 'Yönetici',
          5: 'Süper Admin'
        };

        const userData = {
          ...dataToSend,
          UserID: data ? formData.UserID : response.data.userId,
          Category: categoryMap[dataToSend.Category as number] || 'Bilinmiyor'
        };

        // Store update
        if (data) {
          updateUser(userData);
        } else {
          addUser(userData);
        }

        // Success message
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-emerald-500">Başarılı!</span>
            </div>
          ),
          description: (
            <div className="ml-6">
              <p className="text-gray-600 dark:text-gray-300">
                Kullanıcı başarıyla {data ? 'güncellendi' : 'kaydedildi'}.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.UserName} kullanıcısı {data ? 'güncellendi' : 'oluşturuldu'}.
              </p>
            </div>
          ),
          className: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
          duration: 5000,
        });

        // Close tab
        const tabId = data ? `edit-user-${data.UserID}` : 'new-user-form';
        removeTab(tabId);
        setActiveTab('users-list');

      } else {
        toast({
          title: "Hata!",
          description: response.data.message || `Kullanıcı ${data ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Hata!",
        description: `Kullanıcı ${data ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu. Lütfen tekrar deneyin.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      id: "personal",
      icon: User,
      label: "Kişisel Bilgiler"
    },
    {
      id: "security",
      icon: Shield,
      label: "Güvenlik"
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-4 md:p-2 pt-6 h-[calc(90vh-12rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {data ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
          </h2>
          <p className="text-muted-foreground">
            {data ? 'Kullanıcı bilgilerini düzenleyin' : 'Yeni bir sistem kullanıcısı oluşturun'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            const tabId = data ? `edit-user-${data.UserID}` : 'new-user-form';
            removeTab(tabId);
            setActiveTab('users-list');
          }}
          className="h-8 w-8 hover:scale-105 hover:bg-red-500/10 hover:text-red-600 transition-all"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActivesTab} className="w-full flex-grow">
        <div className="flex-none mb-6">
          <div className="flex items-center gap-4">
            <TabsList className="w-[120vh] bg-gradient-to-b from-background/95 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl p-1.5 shadow-lg">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  icon={<tab.icon className={cn(
                    "w-4 h-4",
                    activeTab === tab.id ? "text-white" : "text-muted-foreground"
                  )} />}
                  className={cn(
                    "ml-2 relative flex items-center gap-2.5 px-6 py-3 transition-all duration-300 rounded-lg hover:bg-muted/50",
                    activeTab === tab.id && "bg-gradient-to-r from-violet-500 via-primary to-blue-500 text-white hover:from-violet-600 hover:via-primary/90 hover:to-blue-600 hover:shadow-md hover:text-white transition-all"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    activeTab === tab.id ? "text-white" : "text-muted-foreground"
                  )}>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-none flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentIndex > 0) {
                    setActivesTab(tabs[currentIndex - 1].id);
                  }
                }}
                className="bg-gradient-to-r from-violet-500 via-primary to-blue-500 text-white hover:from-violet-600 hover:via-primary/90 hover:to-blue-600 hover:shadow-md hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-500 via-primary to-blue-500 text-white hover:from-violet-600 hover:via-primary/90 hover:to-blue-600 hover:shadow-md transition-all"
                disabled={activeTab === "security" && isSaving}
              >
                {activeTab !== "security" ? (
                  <>
                    İleri
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="personal">
          <PersonalInfo formData={formData} setFormData={setFormData} branches={branches} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityInfo
            formData={formData}
            setFormData={setFormData}
            passwordRules={passwordRules}
            checkPasswordRules={checkPasswordRules}
          />
        </TabsContent>
      </Tabs>
    </form>
  );
}