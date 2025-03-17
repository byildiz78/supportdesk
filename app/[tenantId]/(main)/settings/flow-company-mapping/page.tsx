"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFields>({});
  const [companyFields, setCompanyFields] = useState<string[]>([]);
  const [companyFieldDetails, setCompanyFieldDetails] = useState<{[key: string]: any}>({});
  const [currentMapping, setCurrentMapping] = useState<FieldMapping>({
    id: "",
    name: "Varsayılan Eşleştirme",
    mappings: [],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [mappingName, setMappingName] = useState("Varsayılan Eşleştirme");

  // Fetch data on initial load
  useEffect(() => {
    Promise.all([
      fetchFlowFields(),
      fetchCompanyFields(),
      fetchCurrentMapping()
    ]).finally(() => setLoading(false));
  }, []);

  // Fetch Flow company fields
  const fetchFlowFields = async () => {
    try {
      const response = await axios.get(`/supportdesk/api/flow-companies/fields`);
      
      if (response.data && response.data.result) {
        const fields = response.data.result;
        setCustomFields(fields);
      } else {
        toast.error("Flow firma alanları yüklenirken bir hata oluştu");
      }
    } catch (err) {
      console.error("Error fetching flow fields:", err);
      toast.error("Flow firma alanları yüklenirken bir hata oluştu");
    }
  };

  // Fetch our company fields
  const fetchCompanyFields = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/supportdesk/api/main/companies/getCompanyFields`);
      
      if (response.data.success) {
        setCompanyFields(response.data.fields);
        setCompanyFieldDetails(response.data.fieldDetails || {});
      } else {
        toast.error("Firma alanları alınamadı");
      }
    } catch (error) {
      console.error('Error fetching company fields:', error);
      toast.error("Firma alanları alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // Fetch current mapping
  const fetchCurrentMapping = async () => {
    try {
      const response = await axios.get(`/supportdesk/api/main/settings/getFlowCompanyMapping`);
      
      if (response.data && response.data.success && response.data.mapping) {
        setCurrentMapping(response.data.mapping);
        setMappingName(response.data.mapping.name);
      } else {
        // If no mapping exists, create default mapping
        createDefaultMapping();
      }
    } catch (err) {
      console.error("Error fetching mapping:", err);
      // If error (likely no mapping exists), create default mapping
      createDefaultMapping();
    }
  };

  // Create default mapping when none exists
  const createDefaultMapping = () => {
    // Default mappings for essential fields
    const defaultMappings: MappingField[] = [
      { sourceField: "TITLE", targetField: "name", description: "Firma Adı" },
      { sourceField: "ADDRESS", targetField: "address", description: "Adres" },
      { sourceField: "PHONE", targetField: "phone", description: "Telefon" },
      { sourceField: "EMAIL", targetField: "email", description: "E-posta" },
      { sourceField: "ADDRESS_CITY", targetField: "city", description: "Şehir" },
      { sourceField: "ADDRESS_COUNTRY", targetField: "country", description: "Ülke" }
    ];

    setCurrentMapping({
      id: "",
      name: "Varsayılan Eşleştirme",
      mappings: defaultMappings,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // Save mapping
  const saveMapping = async () => {
    if (currentMapping.mappings.length === 0) {
      toast.error("En az bir alan eşleştirmesi yapmalısınız");
      return;
    }

    try {
      setSaving(true);
      
      // Update mapping name and timestamp
      const mappingToSave = {
        ...currentMapping,
        name: currentMapping.name,
        updatedAt: new Date().toISOString(),
        // Filter out empty mappings
        mappings: currentMapping.mappings.filter(m => m.sourceField && m.targetField)
      };

      const response = await axios.post(`/supportdesk/api/main/settings/saveFlowCompanyMapping`, {
        mapping: mappingToSave
      });

      if (response.data && response.data.success) {
        toast.success("Eşleştirme başarıyla kaydedildi");
        setCurrentMapping(response.data.mapping);
      } else {
        toast.error(response.data?.message || "Eşleştirme kaydedilirken bir hata oluştu");
      }
    } catch (err) {
      console.error("Error saving mapping:", err);
      toast.error("Eşleştirme kaydedilirken bir hata oluştu");
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
    const standardFields = ["ID", "TITLE", "ASSIGNED_BY_ID", "DATE_CREATE", "ADDRESS", "ADDRESS_CITY", "ADDRESS_COUNTRY", "PHONE", "EMAIL"];
    const customFieldKeys = Object.keys(customFields).filter(key => key.startsWith("UF_CRM"));
    const allFields = [...standardFields, ...customFieldKeys];
    
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
    return companyFields.filter(field => !selectedFields.includes(field));
  };

  // Get field description
  const getFieldDescription = (field: string): string => {
    if (field.startsWith("UF_CRM") && customFields[field]) {
      return customFields[field].listLabel || customFields[field].title || field;
    }
    
    const fieldDescriptions: {[key: string]: string} = {
      "ID": "Flow ID",
      "TITLE": "Firma Adı",
      "ASSIGNED_BY_ID": "Atanan Kişi ID",
      "DATE_CREATE": "Oluşturma Tarihi",
      "ADDRESS": "Adres",
      "ADDRESS_CITY": "Şehir",
      "ADDRESS_COUNTRY": "Ülke",
      "PHONE": "Telefon",
      "EMAIL": "E-posta"
    };
    
    return fieldDescriptions[field] || field;
  };

  // Get company field description
  const getCompanyFieldDescription = (field: string): string => {
    if (companyFieldDetails[field]) {
      return companyFieldDetails[field].title || field;
    }
    
    const fieldDescriptions: {[key: string]: string} = {
      "id": "ID",
      "name": "Firma Adı",
      "tax_id": "Vergi Numarası",
      "tax_office": "Vergi Dairesi",
      "address": "Adres",
      "city": "Şehir",
      "country": "Ülke",
      "phone": "Telefon",
      "email": "E-posta"
    };
    
    return fieldDescriptions[field] || field;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Flow Firma Alanları Eşleştirme</h2>
        <div className="flex space-x-2">
          <Link href="/flow-companies">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Flow Firmalara Dön
            </Button>
          </Link>
          <Button 
            onClick={saveMapping} 
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Eşleştirmeyi Kaydet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alan Eşleştirme Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="mappingName">Eşleştirme Adı</Label>
                <Input
                  id="mappingName"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Eşleştirme adı girin"
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-medium">
                  <div className="col-span-5">Flow Firma Alanı</div>
                  <div className="col-span-5">Sistem Firma Alanı</div>
                  <div className="col-span-2">İşlemler</div>
                </div>

                {currentMapping.mappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <Select
                        value={mapping.sourceField}
                        onValueChange={(value) => updateMappingField(index, "sourceField", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Flow alanı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFlowFields(index).map((field) => (
                            <SelectItem key={field} value={field}>
                              {field.startsWith("UF_CRM") 
                                ? `${getFieldDescription(field)} (${field})` 
                                : getFieldDescription(field)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5">
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => updateMappingField(index, "targetField", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sistem alanı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCompanyFields(index).map((field) => (
                            <SelectItem key={field} value={field}>
                              {getCompanyFieldDescription(field)} ({field})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex space-x-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeMappingField(index)}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}

                <Button onClick={addMappingField} variant="outline" className="w-full">
                  Yeni Eşleştirme Ekle
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
