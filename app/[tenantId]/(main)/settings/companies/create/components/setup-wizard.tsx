"use client";

import { useState, useEffect, useRef } from 'react';
import { Check, Database, Loader2, Server, X } from 'lucide-react';
import axios from '@/lib/axios';
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
import { useTabStore } from "@/stores/tab-store";

interface Company {
  id: number;
  companyName: string;
  tenantName: string;
  companyKey: string;
  isActive: boolean;
  addDate: string;
  editDate: string | null;
  addUser: string;
  editUser: string | null;
}

interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  initialTenantId: string;
  onSuccess: () => Promise<void>;
}

export function SetupWizard({ open, onOpenChange, companyName, initialTenantId, onSuccess }: SetupWizardProps) {
  const { removeTab, setActiveTab } = useTabStore();
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<any>(null);
  const [setupSteps, setSetupSteps] = useState([
    { id: 1, name: 'Schema oluşturma', status: 'waiting' },
    { id: 2, name: 'Filegroup yapılandırma', status: 'waiting' },
    { id: 3, name: 'Tablo yapılarını oluşturma', status: 'waiting' },
    { id: 4, name: 'Kurulum tamamlama', status: 'waiting' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const validateTenantId = (value: string): boolean => {
    // Schema adı sadece harf, rakam ve alt çizgi içerebilir, sayı ile başlayamaz
    const schemaNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return schemaNameRegex.test(value);
  };

  const handleSetupSubmit = async () => {
    if (!validateTenantId(initialTenantId)) {
      setError('Tenant ID sadece harf, rakam ve alt çizgi içerebilir ve sayı ile başlayamaz.');
      return;
    }

    setLoading(true);
    setError(null);

    // İlerleme adımlarını sıfırla
    setSetupSteps(setupSteps.map(step => ({ ...step, status: 'waiting' })));

    try {
      // Schema oluşturma adımı
      updateStepStatus(1, 'in-progress');

      const response = await axios.post('/api/settings/setup', JSON.stringify({ 
        tenantId: initialTenantId
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data) {
        throw new Error('Kurulum sırasında bir hata oluştu.');
      }

      const data = response.data;
      setSetupStatus(data);

      // Başarılı adımları güncelle
      updateSetupStepsFromResponse(data);

      // Kurulum başarılıysa şirketi kaydet ve tamamlandı durumunu güncelle
      if (data.tables && data.tables.status === 'success') {
        setSetupCompleted(true);
        await onSuccess();
      }

    } catch (err: unknown) {
      console.error('Kurulum hatası:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kurulum sırasında bir hata oluştu.';
      setError(errorMessage);

      // Hata durumunda tüm adımları durdur
      setSetupSteps(setupSteps.map(step =>
        step.status === 'in-progress' ? { ...step, status: 'error' } : step
      ));

    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (stepId: number, status: string) => {
    setSetupSteps(prev =>
      prev.map(step => step.id === stepId ? { ...step, status } : step)
    );
  };

  const updateSetupStepsFromResponse = (data: any) => {
    if (data.schema && data.schema.status === 'success') {
      updateStepStatus(1, 'complete');
    } else {
      updateStepStatus(1, 'error');
    }

    if (data.filegroup && data.filegroup.status === 'success') {
      updateStepStatus(2, 'complete');
    } else {
      updateStepStatus(2, 'error');
    }

    if (data.tables && data.tables.status === 'success') {
      updateStepStatus(3, 'complete');
      updateStepStatus(4, 'complete');
    } else if (data.tables) {
      updateStepStatus(3, 'error');
      updateStepStatus(4, 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"></div>;
    }
  };

  const cancelSetup = () => {
    onOpenChange(false);
    setSetupSteps(setupSteps.map(step => ({ ...step, status: 'waiting' })));
    setError(null);
    setSetupStatus(null);
    setSetupCompleted(false);
    
    // Eğer kurulum tamamlandıysa, tabı kapat ve firma listesine yönlendir
    if (setupCompleted) {
      removeTab('new-company-form');
      setActiveTab('companies-list');
    }
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(value) => {
        // Prevent auto-closing when loading or when setup is in progress
        if (loading || setupSteps.some(step => step.status === 'in-progress')) {
          return;
        }
        onOpenChange(value);
      }}
    >
      <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Veritabanı Kurulum Sihirbazı</AlertDialogTitle>
          <AlertDialogDescription>
            {companyName} firması için veritabanı kurulumu yapılacak. Devam etmek istiyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 overflow-y-auto flex-grow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="tenantId">
              Tenant ID (Schema Adı)
            </label>
            
            <div className="relative">
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <span className="font-medium">{initialTenantId}</span>
              </div>
            </div>
            
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tenant ID firma oluşturulurken belirlenir ve değiştirilemez
            </p>
          </div>

          {/* Kurulum Adımları */}
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Kurulum Adımları</h3>
            
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full">
                  {getStatusIcon(step.status)}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'complete' ? 'text-green-700 dark:text-green-400' :
                    step.status === 'error' ? 'text-red-700 dark:text-red-400' :
                    step.status === 'in-progress' ? 'text-blue-700 dark:text-blue-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {step.name}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    step.status === 'complete' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    step.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    step.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {step.status === 'complete' && 'Tamamlandı'}
                    {step.status === 'in-progress' && 'İşleniyor'}
                    {step.status === 'error' && 'Hata'}
                    {step.status === 'waiting' && 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Başarı mesajı */}
          {setupSteps.every(step => step.status === 'complete') && (
            <div className="mt-6">
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                      Kurulum başarıyla tamamlandı!
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>
                        <strong>{initialTenantId}</strong> tenant'ı başarıyla oluşturuldu. Firma kaydı tamamlanıyor...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sonuç gösterimi */}
          {setupStatus && (
            <div className="mt-6">
              <details className="rounded-md bg-gray-50 dark:bg-gray-800/50 p-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kurulum Detaylarını Göster
                </summary>
                <div className="mt-2 max-h-[200px] overflow-y-auto">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(setupStatus, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-shrink-0">
          {setupCompleted ? (
            <AlertDialogAction 
              onClick={cancelSetup}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              <span>Kapat</span>
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel onClick={cancelSetup}>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault(); // Prevent default action which might close the dialog
                  handleSetupSubmit();
                }}
                disabled={loading || setupSteps.every(step => step.status === 'complete')}
                className={`${
                  setupSteps.every(step => step.status === 'complete')
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Kurulum yapılıyor...</span>
                  </>
                ) : setupSteps.every(step => step.status === 'complete') ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    <span>Tamamlandı</span>
                  </>
                ) : (
                  <>
                    <Server className="mr-2 h-4 w-4" />
                    <span>Kurulumu Başlat</span>
                  </>
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
