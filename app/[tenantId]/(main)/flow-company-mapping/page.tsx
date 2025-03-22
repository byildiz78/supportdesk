"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, Plus, Trash2, Settings2 } from "lucide-react";
import axios from "@/lib/axios";
import { useFlowFields } from "@/providers/flow-field-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTabStore } from "@/stores/tab-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast/use-toast";

interface MappingField {
  sourceField: string;
  targetField: string;
  description: string;
}

interface FieldMapping {
  id: string;
  name: string;
  mappings: MappingField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomField {
  type: string;
  title: string;
  listLabel: string;
}

interface CustomFields {
  [key: string]: CustomField;
}

export default function FlowCompanyMappingPage() {
  const [loading, setLoading] = useState(true);
  const [companyFieldsLoading, setCompanyFieldsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { customFields, fetchFields, isInitialized } = useFlowFields();
  const [companyFields, setCompanyFields] = useState<string[]>([]);
  const [companyFieldDetails, setCompanyFieldDetails] = useState<{ [key: string]: any }>({});
  const [currentMapping, setCurrentMapping] = useState<FieldMapping>({
    id: "",
    name: "Varsayılan Eşleştirme",
    mappings: [],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [mappingName, setMappingName] = useState("Varsayılan Eşleştirme");
  const [activeTab, setActiveTab] = useState("mapping");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { removeTab: removeTabFromStore, setActiveTab: setActiveTabFromStore } = useTabStore();
  const { toast } = useToast();

  // Fetch data on initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all data in parallel
        await Promise.all([
          // Provider'da otomatik olarak yükleniyor, sadece customFields boşsa çağır
          Object.keys(customFields).length === 0 ? fetchFields() : Promise.resolve(customFields),
          fetchCompanyFields(),
          fetchFlowFields(),
          fetchCurrentMapping()
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch company fields from our PostgreSQL database
  const fetchCompanyFields = async () => {
    try {
      setCompanyFieldsLoading(true);
      const response = await axios.get(`/api/flow-companies/company-fields`);

      if (response.data.success) {
        // Tüm alanları state'e kaydet
        setCompanyFields(response.data.fields || []);
        setCompanyFieldDetails(response.data.fieldDetails || {});
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Firma alanları alınamadı",
        });
      }
    } catch (error) {
      console.error('Error fetching company fields:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Firma alanları alınamadı",
      });
    } finally {
      setCompanyFieldsLoading(false);
    }
  };

  // Fetch Flow fields from API
  const fetchFlowFields = async () => {
    try {
      const response = await axios.get(`/api/flow-companies/fields`);
      if (response.data && response.data.result) {
        // API'den gelen veri zaten provider'a kaydediliyor
      }
    } catch (error) {
      console.error('Error fetching Flow fields:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Flow firma alanları alınamadı",
      });
    }
  };

  const fetchCurrentMapping = async () => {
    try {
      // First try to get existing mapping
      const response = await axios.get(`/api/flow-companies/getFlowCompanyMapping`);
      
      if (response.data && response.data.success && response.data.mapping) {
        // If mapping exists, use it
        setCurrentMapping(response.data.mapping);
        setMappingName(response.data.mapping.name);
      } else {
        // If no mapping exists, just create a default mapping in state but don't save it
        const defaultMapping = createDefaultMapping();
        toast({
          title: "Bilgi",
          description: "Henüz kaydedilmiş bir eşleştirme bulunamadı. Varsayılan şablon yüklendi.",
        });
      }
    } catch (err) {
      console.error("Error fetching mapping:", err);
      // If error, just create a default mapping in state but don't save it
      createDefaultMapping();
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Eşleştirme yüklenirken bir hata oluştu. Varsayılan şablon yüklendi.",
      });
    }
  };

  const createDefaultMapping = () => {
    const defaultMappings: MappingField[] = [
      { sourceField: "TITLE", targetField: "name", description: "Firma Adı" },
      { sourceField: "ADDRESS", targetField: "address", description: "Adres" },
      { sourceField: "PHONE", targetField: "phone", description: "Telefon" },
      { sourceField: "EMAIL", targetField: "email", description: "E-posta" },
      { sourceField: "ADDRESS_CITY", targetField: "city", description: "Şehir" },
      { sourceField: "ADDRESS_COUNTRY", targetField: "country", description: "Ülke" }
    ];

    const defaultMapping = {
      id: "",
      name: "Varsayılan Eşleştirme",
      mappings: defaultMappings,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentMapping(defaultMapping);
    return defaultMapping;
  };

  // Save mapping
  const saveMapping = async () => {
    if (currentMapping.mappings.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "En az bir alan eşleştirmesi yapmalısınız",
      });
      return;
    }

    // Show confirmation modal instead of saving immediately
    setShowConfirmationModal(true);
  };

  // Handle the actual saving after confirmation
  const handleConfirmedSave = async () => {
    try {
      setSaving(true);
      setShowConfirmationModal(false);

      // Update mapping name and timestamp
      const mappingToSave = {
        ...currentMapping,
        name: mappingName,
        updatedAt: new Date().toISOString(),
        // Filter out empty mappings
        mappings: currentMapping.mappings.filter(m => m.sourceField && m.targetField)
      };

      const response = await axios.post(`/api/flow-companies/createFlowCompanyMapping`, {
        mapping: mappingToSave
      });

      if (response.data && response.data.success) {
        toast({
          title: "Bilgi",
          description: "Eşleştirme başarıyla kaydedildi",
        });
        setCurrentMapping(response.data.mapping);
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: response.data?.message || "Eşleştirme kaydedilirken bir hata oluştu",
        });
      }
    } catch (err) {
      console.error("Error saving mapping:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Eşleştirme kaydedilirken bir hata oluştu",
      });
    } finally {
      setSaving(false);
    }
  };

  // Add a new mapping field
  const addMappingField = () => {
    setCurrentMapping(prev => ({
      ...prev,
      mappings: [
        ...prev.mappings,
        { sourceField: "", targetField: "", description: "" }
      ]
    }));
  };

  // Remove a mapping field
  const removeMappingField = (index: number) => {
    setCurrentMapping(prev => ({
      ...prev,
      mappings: prev.mappings.filter((_, i) => i !== index)
    }));
  };

  // Update a mapping field
  const updateMappingField = (index: number, field: keyof MappingField, value: string) => {
    setCurrentMapping(prev => {
      const newMappings = [...prev.mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      return {
        ...prev,
        mappings: newMappings
      };
    });
  };

  // Get all available flow fields, excluding already selected ones
  const getAvailableFlowFields = (currentIndex: number) => {
    // Provider'dan gelen tüm alanları al
    const allFields = Object.keys(customFields);
    
    // Get all selected source fields except the current one
    const selectedFields = currentMapping.mappings
      .filter((_, index) => index !== currentIndex)
      .map(m => m.sourceField);

    // Return only fields that are not already selected
    return allFields.filter(field => !selectedFields.includes(field));
  };

  // Get all available company fields, excluding already selected ones
  const getAvailableCompanyFields = (currentIndex: number) => {
    // Get all selected target fields except the current one
    const selectedFields = currentMapping.mappings
      .filter((_, index) => index !== currentIndex)
      .map(m => m.targetField);
    
    // Return only fields that are not already selected
    const availableFields = companyFields.filter(field => !selectedFields.includes(field));
    return availableFields;
  };

  // Get field description for Flow fields
  const getFieldDescription = (field: string): string => {
    // Eğer customFields içinde bu alan varsa, onun başlığını kullan
    if (customFields[field]) {
      return customFields[field].listLabel || customFields[field].title || field;
    }
    
    // Yoksa alan adını daha kullanıcı dostu hale getir
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get company field description
  const getCompanyFieldDescription = (field: string): string => {
    // Eğer companyFieldDetails içinde bu alan varsa, onun tipini kullan
    if (companyFieldDetails[field]) {
      // Alan adını daha kullanıcı dostu hale getir
      const friendlyName = field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return friendlyName;
    }
    
    // Yoksa alan adının kendisini döndür
    return field;
  };

  // Count mapped fields by category
  const getMappingStats = () => {
    const mappedFields = currentMapping.mappings.filter(m => m.sourceField && m.targetField);
    const standardFields = mappedFields.filter(m => !m.sourceField.startsWith("UF_CRM")).length;
    const customFields = mappedFields.filter(m => m.sourceField.startsWith("UF_CRM")).length;

    return {
      total: mappedFields.length,
      standard: standardFields,
      custom: customFields
    };
  };

  const stats = getMappingStats();

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const removeTab = () => {
    const tabId = "Alan Eşleştirme Ayarları";
    removeTabFromStore(tabId);
    setActiveTabFromStore('Flow Firmaları');
  }

  return (
    <div className="flex-1 space-y-2 p-4 md:p-4 pt-4 bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flow Firma Alanları Eşleştirme</h1>
          <p className="text-muted-foreground mt-1">
            Flow CRM ve sistem firma alanlarını eşleştirerek veri entegrasyonunu yapılandırın
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={removeTab}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Flow Firmalara Dön
          </Button>
          <Button
            onClick={saveMapping}
            disabled={saving}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sol taraf - İstatistikler */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Eşleştirme Bilgileri</CardTitle>
              <CardDescription>Geçerli eşleştirme ayarları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mappingName" className="text-xs font-medium text-muted-foreground">Eşleştirme Adı</Label>
                  <Input
                    id="mappingName"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    placeholder="Eşleştirme adı girin"
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">İstatistikler</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Toplam</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Standart</p>
                      <p className="text-xl font-bold">{stats.standard}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Özel</p>
                      <p className="text-xl font-bold">{stats.custom}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Son Güncelleme</p>
                  <p className="text-sm">{new Date(currentMapping.updatedAt).toLocaleString('tr-TR')}</p>
                </div>

                <Button
                  onClick={addMappingField}
                  variant="outline"
                  className="w-full mt-4"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Eşleştirme Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ taraf - Eşleştirme tablosu */}
        <div className="md:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Alan Eşleştirmeleri</CardTitle>
              <CardDescription>Flow alanlarını sistem alanlarıyla eşleştirin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-2 py-2 bg-muted rounded-md text-sm font-medium">
                  <div className="col-span-5">Flow Firma Alanı</div>
                  <div className="col-span-5">Sistem Firma Alanı</div>
                  <div className="col-span-2 text-center">İşlemler</div>
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-4">
                    <AnimatePresence initial={false}>
                      {currentMapping.mappings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Henüz eşleştirme eklenmemiş</p>
                          <Button
                            onClick={addMappingField}
                            variant="outline"
                            className="mt-4"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Eşleştirme Ekle
                          </Button>
                        </div>
                      ) : (
                        currentMapping.mappings.map((mapping, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-12 gap-4 items-center p-2 rounded-md hover:bg-muted/50"
                          >
                            <div className="col-span-5">
                              <Select
                                value={mapping.sourceField}
                                onValueChange={(value) => updateMappingField(index, "sourceField", value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Flow alanı seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {getAvailableFlowFields(index).map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {getFieldDescription(field)} <span className="text-xs text-muted-foreground">({field})</span>
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                              {mapping.sourceField && (
                                <div className="mt-1 text-xs text-muted-foreground truncate">
                                  {getFieldDescription(mapping.sourceField)} <span className="text-xs text-muted-foreground">({mapping.sourceField})</span>
                                </div>
                              )}
                            </div>
                            <div className="col-span-5">
                              <Select
                                value={mapping.targetField}
                                onValueChange={(value) => updateMappingField(index, "targetField", value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Sistem alanı seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {companyFieldsLoading ? (
                                      <div className="p-2 text-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                        Alanlar yükleniyor...
                                      </div>
                                    ) : getAvailableCompanyFields(index).length === 0 ? (
                                      <div className="p-2 text-center text-muted-foreground">
                                        Tüm alanlar kullanımda
                                      </div>
                                    ) : (
                                      getAvailableCompanyFields(index).map((field) => (
                                        <SelectItem key={field} value={field}>
                                          {getCompanyFieldDescription(field)} <span className="text-xs text-muted-foreground">({field})</span>
                                        </SelectItem>
                                      ))
                                    )}
                                  </div>
                                </SelectContent>
                              </Select>
                              {mapping.targetField && (
                                <div className="mt-1 text-xs text-muted-foreground truncate">
                                  {getCompanyFieldDescription(mapping.targetField)} <span className="text-xs text-muted-foreground">({mapping.targetField})</span>
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => removeMappingField(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {currentMapping.mappings.length > 0 && (
                  <Button
                    onClick={addMappingField}
                    variant="outline"
                    className="w-full mt-4"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Eşleştirme Ekle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eşleştirmeyi Kaydet</DialogTitle>
          </DialogHeader>
          <DialogDescription className="pt-4">
            <p className="mb-4">"{mappingName}" isimli eşleştirmeyi kaydetmek istediğinizden emin misiniz?</p>
            
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <p className="font-medium mb-2">Eşleştirme Özeti:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Toplam {currentMapping.mappings.filter(m => m.sourceField && m.targetField).length} alan eşleştirmesi</li>
                <li>{stats.standard} standart alan</li>
                <li>{stats.custom} özel alan</li>
              </ul>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Bu işlem mevcut eşleştirmeyi güncelleyecektir. Devam etmek istiyor musunuz?
            </p>
          </DialogDescription>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>İptal</Button>
            <Button 
              onClick={handleConfirmedSave} 
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Evet, Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}