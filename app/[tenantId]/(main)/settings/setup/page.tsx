"use client";

import { useState, useEffect, useRef } from 'react';
import { Check, Database, HardDrive, Loader2, RefreshCw, Server, Shield, X, ChevronDown, Search } from 'lucide-react';
import axios from '@/lib/axios';

// Sadece gerekli temel bileşenler
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const SetupPage = () => {
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupSteps, setSetupSteps] = useState([
    { id: 1, name: 'Schema oluşturma', status: 'waiting' },
    { id: 2, name: 'Filegroup yapılandırma', status: 'waiting' },
    { id: 3, name: 'Tablo yapılarını oluşturma', status: 'waiting' },
    { id: 4, name: 'Kurulum tamamlama', status: 'waiting' },
  ]);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Şirket verilerini çek
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await axios.get('/api/settings/setup/setup-companiest-list');
        if (response.data && Array.isArray(response.data)) {
          setCompanies(response.data as Company[]);
        }
      } catch (error) {
        console.error('Şirket verileri alınırken hata oluştu:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Dropdown dışı tıklamayı kontrol et
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateTenantId = (value) => {
    // Schema adı sadece harf, rakam ve alt çizgi içerebilir, sayı ile başlayamaz
    const schemaNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return schemaNameRegex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateTenantId(tenantId)) {
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

      const response = await axios.post('/api/settings/setup', JSON.stringify({ tenantId }), {
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

    } catch (err) {
      console.error('Kurulum hatası:', err);
      setError(err.message || 'Kurulum sırasında bir hata oluştu.');

      // Hata durumunda tüm adımları durdur
      setSetupSteps(setupSteps.map(step =>
        step.status === 'in-progress' ? { ...step, status: 'error' } : step
      ));

    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (stepId, status) => {
    setSetupSteps(prev =>
      prev.map(step => step.id === stepId ? { ...step, status } : step)
    );
  };

  const updateSetupStepsFromResponse = (data) => {
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

  const getStatusIcon = (status) => {
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

  // Şirketleri filtrele
  const filteredCompanies = searchText
    ? companies.filter(company => 
        company.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        company.tenantName.toLowerCase().includes(searchText.toLowerCase())
      )
    : companies;

  return (
    <div className=" bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 max-h-[80vh] overflow-y-auto
                            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-transparent
                            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                            dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Database className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Veritabanı Kurulum Sihirbazı</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Yeni tenant oluştur ve tabloları yapılandır</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tenant Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="tenantId">
                  Tenant ID (Schema Adı)
                </label>
                
                <div className="relative">
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      ref={buttonRef}
                    >
                      <span>{tenantId || "Firma seçin veya ID girin"}</span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </button>
                    
                    {dropdownOpen && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
                        ref={dropdownRef}
                      >
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Firma ara veya ID gir"
                              className="pl-8 w-full"
                              value={searchText}
                              onChange={(e) => {
                                setSearchText(e.target.value);
                                setTenantId(e.target.value);
                                if (error && validateTenantId(e.target.value)) {
                                  setError(null);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1">
                          {loadingCompanies ? (
                            <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                              Firmalar yükleniyor...
                            </div>
                          ) : filteredCompanies.length > 0 ? (
                            filteredCompanies.map(company => (
                              <button
                                key={company.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  setTenantId(company.tenantName);
                                  setDropdownOpen(false);
                                  if (error && validateTenantId(company.tenantName)) {
                                    setError(null);
                                  }
                                }}
                              >
                                <div className="font-medium text-sm">{company.companyName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{company.tenantName}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                              Firma bulunamadı
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tenant ID sadece harf, rakam ve alt çizgi içerebilir
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Kurulum yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <Server className="mr-2 h-4 w-4" />
                    <span>Kurulumu Başlat</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Kurulum Adımları */}
        <Card>
          <CardHeader>
            <CardTitle>Kurulum Adımları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                          <strong>{tenantId}</strong> tenant'ı başarıyla oluşturuldu. Sistemi kullanmaya başlayabilirsiniz.
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={() => {
                            setTenantId('');
                            setSetupStatus(null);
                            setSetupSteps(setupSteps.map(step => ({ ...step, status: 'waiting' })));
                            setError(null);
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Yeni Kurulum Başlat
                        </Button>
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
                  <div className="mt-2 overflow-x-auto">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      {JSON.stringify(setupStatus, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupPage;