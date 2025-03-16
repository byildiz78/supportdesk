'use client';

import { useEffect, useState } from "react";
import { Building2, Save, X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";
import { toast } from "@/components/ui/toast/use-toast";
import { useTabStore } from "@/stores/tab-store";
import { useFilterStore } from "@/stores/filters-store";
import { Efr_Companies } from "@/pages/api/settings/companies/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";
import { SetupWizard } from "./components/setup-wizard";
import { useCompaniesStore } from "@/stores/companies/companies-store";

interface CompanyFormProps {
  onClose?: () => void;
  data?: Efr_Companies;
}

export default function CompanyForm(props: CompanyFormProps) {
  const { data } = props;
  const { selectedFilter } = useFilterStore();
  const { addCompany, updateCompany } = useCompaniesStore();
  const { removeTab, setActiveTab } = useTabStore();
  const [activeTab, setActivesTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    companyName: false,
    tenantName: false,
    companyKey: false
  });
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);

  const [formData, setFormData] = useState<Efr_Companies>(() => {
    if (data) {
      return { ...data };
    }
    // Yeni kayıt için GUID otomatik oluştur
    const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return {
      id: 0,
      companyName: "",
      tenantName: "",
      companyKey: guid,
      isActive: true,
      addDate: new Date().toISOString(),
      addUser: "",
      editDate: null,
      editUser: null
    };
  });

  useEffect(() => {
    // Tenant ID'yi pathname'den çıkar
    const tenantId = pathname?.split('/')[1];
    
    // Kullanıcı bilgilerini localStorage'dan al
    if (tenantId) {
      const userData = localStorage.getItem(`userData_${tenantId}`);
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          setCurrentUser({
            name: parsedUserData.name || parsedUserData.username || '',
            email: parsedUserData.email || ''
          });
        } catch (error) {
          console.error("User data parsing error:", error);
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    // Kullanıcı bilgisi geldiğinde formData'yı güncelle
    if (currentUser && !data) {
      setFormData(prev => ({
        ...prev,
        addUser: currentUser.name || currentUser.email
      }));
    }
  }, [currentUser, data]);

  useEffect(() => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        ...data
      }));
      setInitialFormData({...data});
    }
  }, [data]);

  const [initialFormData, setInitialFormData] = useState({...formData});

  // Check for changes in the form
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(formChanged);
  }, [formData, initialFormData]);

  // Generate GUID for companyKey
  const generateGuid = () => {
    const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    setFormData(prev => ({
      ...prev,
      companyKey: guid
    }));
    
    setHasChanges(true);
    
    toast({
      title: "GUID Oluşturuldu",
      description: "Firma anahtarı başarıyla oluşturuldu. Form henüz kaydedilmedi.",
    });
  };

  const validateForm = () => {
    const errors = {
      companyName: !formData.companyName,
      tenantName: !formData.tenantName,
      companyKey: !formData.companyKey
    };
    
    setValidationErrors(errors);
    
    if (errors.companyName || errors.tenantName || errors.companyKey) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate required fields
    const errors = {
      companyName: !formData.companyName,
      tenantName: !formData.tenantName,
      companyKey: !formData.companyKey
    };

    setValidationErrors(errors);

    // Check if there are any validation errors
    if (Object.values(errors).some(error => error)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // API endpoint and method selection
    const isUpdate = !!formData.id;
    
    // Yeni kayıt ise SetupWizard modalını aç
    if (!isUpdate) {
      setShowSetupWizard(true);
      return;
    }
    
    try {
      setIsSaving(true);
      const dataToSend = {
        ...formData,
        editDate: new Date().toISOString(), // Update edit date
        editUser: currentUser ? (currentUser.name || currentUser.email) : formData.editUser
      };

      // API endpoint and method selection
      const endpoint = isUpdate
        ? "/api/settings/companies/settings_companies_update"
        : "/api/settings/companies/settings_companies_create";

      const response = await axios.post(endpoint, dataToSend);

      if (response.data.success) {
        // Update store based on operation type
        if (isUpdate) {
          updateCompany(response.data.company);
        } else {
          addCompany(response.data.company);
        }

        // Show success message
        toast({
          title: `Company ${isUpdate ? "Güncelleme" : "Oluşturma"} Başarıyla Gerçekleştirildi`,
          description: `${formData.companyName} has been ${isUpdate ? "updated" : "created"}.`,
        });

        // Reset form state
        setHasChanges(false);
        setInitialFormData({...formData});
        const tabId = data ? `edit-company-${data.id}` : 'new-company-form';
        removeTab(tabId);
        setActiveTab('companies-list');
        // Close form if needed
        if (props.onClose) {
          props.onClose();
        }
      } else {
        // Show error message
        toast({
          title: "Operation Failed",
          description: response.data.message || "An error occurred during the operation.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Operation Failed",
        description: error.response?.data?.message || "An error occurred during the operation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      closeForm();
    }
  };
  
  const closeForm = () => {
    const tabId = data ? `edit-company-${data.id}` : 'new-company-form';
    removeTab(tabId);
    setActiveTab('companies-list');
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col space-y-6 p-6 h-[calc(90vh-10rem)]">
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {data ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? 'Firma bilgilerini düzenleyin' : 'Yeni bir firma kaydı oluşturun'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Kaydediliyor</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span>Kaydet</span>
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              <span>Kapat</span>
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="font-medium">
                  Firma Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Firma adını girin"
                  value={formData.companyName}
                  onChange={(e) => {
                    setFormData({ ...formData, companyName: e.target.value });
                    if (e.target.value) {
                      setValidationErrors({...validationErrors, companyName: false});
                    }
                  }}
                  className={cn(
                    validationErrors.companyName && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {validationErrors.companyName && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Firma adı zorunludur
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="font-medium">
                  Tenant Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenantName"
                  placeholder="Tenant adını girin"
                  value={formData.tenantName}
                  onChange={(e) => {
                    setFormData({ ...formData, tenantName: e.target.value });
                    if (e.target.value) {
                      setValidationErrors({...validationErrors, tenantName: false});
                    }
                  }}
                  disabled={!!data}
                  className={cn(
                    validationErrors.tenantName && "border-red-500 focus-visible:ring-red-500",
                    !!data && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70"
                  )}
                />
                {validationErrors.tenantName && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Tenant adı zorunludur
                  </p>
                )}
                {!!data && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-blue-500" />
                    Düzenleme modunda tenant adı değiştirilemez
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyKey" className="font-medium">
                  Firma Anahtarı <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="companyKey"
                    placeholder="Firma anahtarını girin veya oluşturun"
                    value={formData.companyKey}
                    onChange={(e) => {
                      setFormData({ ...formData, companyKey: e.target.value });
                      if (e.target.value) {
                        setValidationErrors({...validationErrors, companyKey: false});
                      }
                    }}
                    disabled={!!data} 
                    className={cn(
                      "flex-1",
                      validationErrors.companyKey && "border-red-500 focus-visible:ring-red-500",
                      !!data && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70" 
                    )}
                  />
                  <Button 
                    type="button" 
                    onClick={generateGuid}
                    variant="outline"
                    disabled={!!data} 
                    className={cn(
                      "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700",
                      !!data && "opacity-50 cursor-not-allowed" 
                    )}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    GUID Oluştur
                  </Button>
                </div>
                {validationErrors.companyKey && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Firma anahtarı zorunludur
                  </p>
                )}
                {!!data && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-blue-500" />
                    Düzenleme modunda firma anahtarı değiştirilemez
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isActive" className="block font-medium mb-2">Durum</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer font-medium text-sm">
                    {formData.isActive ? 'Aktif' : 'Pasif'}
                  </Label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.isActive 
                    ? 'Firma aktif durumdadır ve sisteme erişebilir.' 
                    : 'Firma pasif durumdadır ve sisteme erişemez.'}
                </p>
              </div>
            </div>

            {data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</Label>
                  <p className="text-sm font-medium">
                    {new Date(formData.addDate).toLocaleString('tr-TR')}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Son Güncelleme</Label>
                  <p className="text-sm font-medium">
                  {formData.editDate ? new Date(formData.editDate).toLocaleString('tr-TR') : ""}
                  </p>
                </div>
                
                {formData.addUser && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Oluşturan Kullanıcı</Label>
                    <p className="text-sm font-medium">{formData.addUser}</p>
                  </div>
                )}
                
                {formData.editUser && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Güncelleyen Kullanıcı</Label>
                    <p className="text-sm font-medium">{formData.editUser}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Değişiklikleri kaydetmeden çıkmak istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Yaptığınız değişiklikler kaydedilmeyecek. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction 
              onClick={closeForm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Kaydetmeden Çık
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setup Wizard Component */}
      <SetupWizard 
        open={showSetupWizard} 
        onOpenChange={setShowSetupWizard}
        companyName={formData.companyName}
        initialTenantId={formData.tenantName}
        onSuccess={async () => {
          try {
            setIsSaving(true);
            const dataToSend = {
              ...formData,
              addDate: new Date().toISOString(),
              addUser: currentUser?.name || "unknown"
            };

            const response = await axios.post('/api/settings/companies/settings_companies_create', dataToSend);

            if (response.data.success) {
              addCompany(response.data.company);
              toast({
                title: "Başarılı",
                description: "Firma başarıyla oluşturuldu",
                variant: "default"
              });
              setHasChanges(false);
              
            }
          } catch (error) {
            console.error("Firma oluşturulurken hata oluştu:", error);
            toast({
              title: "Hata",
              description: "Firma oluşturulurken bir hata oluştu",
              variant: "destructive"
            });
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </>
  );
}