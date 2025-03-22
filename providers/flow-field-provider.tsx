"use client";

import axios from "@/lib/axios";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface CustomField {
  type: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isImmutable?: boolean;
  isMultiple?: boolean;
  isDynamic?: boolean;
  title: string;
  listLabel: string;
  formLabel?: string;
  filterLabel?: string;
  settings?: any;
}

interface CustomFields {
  [key: string]: CustomField;
}

interface FlowFieldsContextType {
  customFields: CustomFields;
  loading: boolean;
  error: string | null;
  fetchFields: () => Promise<void>;
  isInitialized: boolean;
}

const FlowFieldsContext = createContext<FlowFieldsContextType | undefined>(undefined);

export function FlowFieldsProvider({ children }: { children: ReactNode }) {
  const [customFields, setCustomFields] = useState<CustomFields>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Otomatik olarak sayfa yüklendiğinde alanları çek
  useEffect(() => {
    if (!isInitialized && Object.keys(customFields).length === 0) {
      fetchFields();
    }
  }, [isInitialized, customFields]);

  const fetchFields = async () => {
    // Eğer zaten alanlar yüklenmişse tekrar API çağrısı yapma
    if (Object.keys(customFields).length > 0 && !loading) {
      return customFields;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/flow-companies/fields`);
      
      if (response.data && response.data.result) {
        const fields = response.data.result;
        setCustomFields(fields);
        setIsInitialized(true);
        return fields;
      } else {
        const errorMsg = "Özel alanlar yüklenirken bir hata oluştu";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = "Özel alanlar yüklenirken bir hata oluştu";
      setError(errorMsg);
      console.error("Error fetching custom fields:", err);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowFieldsContext.Provider
      value={{
        customFields,
        loading,
        error,
        fetchFields,
        isInitialized
      }}
    >
      {children}
    </FlowFieldsContext.Provider>
  );
}

export function useFlowFields() {
  const context = useContext(FlowFieldsContext);
  if (context === undefined) {
    throw new Error("useFlowFields must be used within a FlowFieldsProvider");
  }
  return context;
}
