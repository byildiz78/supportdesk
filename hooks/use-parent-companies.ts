import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useCustomersStore } from '@/stores/customers-store';
import { MainCompany } from '@/types/customers';

interface UseParentCompaniesOptions {
  initialLoad?: boolean;
  limit?: number;
  offset?: number;
}

interface ParentCompanyApiResponse {
  data: any[];
  total: number;
  limit?: number;
  offset?: number;
}

export function useParentCompanies(options: UseParentCompaniesOptions = {}) {
  const { initialLoad = true, limit = 10, offset = 0 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const { 
    mainCompanies, 
    setMainCompanies, 
    addMainCompany, 
    updateMainCompany, 
    deleteMainCompany,
    setIsLoading: setStoreLoading,
    setError: setStoreError
  } = useCustomersStore();

  // Ana şirketleri getir
  const fetchParentCompanies = useCallback(async (params: { 
    search?: string; 
    is_active?: boolean;
    limit?: number;
    offset?: number;
  } = {}) => {
    setIsLoading(true);
    setStoreLoading(true);
    setError(null);
    setStoreError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      if (params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
      }
      
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }
      
      const response = await axios.get<ParentCompanyApiResponse>(
        `/franchisemanager/api/parent-companies?${queryParams.toString()}`
      );
      
      // PostgreSQL verilerini MainCompany tipine dönüştür
      const convertedData: MainCompany[] = response.data.data.map(item => ({
        id: item.id,
        name: item.name,
        address: item.address || '',
        phone: item.phone || '',
        email: item.email || '',
        flowId: item.tax_id || '',
        notes: item.notes || '',
        createdAt: new Date(item.created_at).toISOString(),
        createdBy: item.created_by,
        updatedAt: item.updated_at ? new Date(item.updated_at).toISOString() : undefined,
        updatedBy: item.updated_by
      }));
      
      setMainCompanies(convertedData);
      setTotal(response.data.total);
      
      return {
        data: convertedData,
        total: response.data.total,
        limit: response.data.limit,
        offset: response.data.offset
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ana şirketleri getirirken bir hata oluştu';
      setError(errorMessage);
      setStoreError(errorMessage);
      console.error('Ana şirketleri getirirken hata:', err);
      return { data: [], total: 0 };
    } finally {
      setIsLoading(false);
      setStoreLoading(false);
    }
  }, [setMainCompanies, setStoreLoading, setStoreError]);

  // Belirli bir ana şirketi getir
  const fetchParentCompany = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/franchisemanager/api/parent-companies/${id}`);
      
      // PostgreSQL verisini MainCompany tipine dönüştür
      const convertedData: MainCompany = {
        id: response.data.id,
        name: response.data.name,
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        flowId: response.data.tax_id || '',
        notes: response.data.notes || '',
        createdAt: new Date(response.data.created_at).toISOString(),
        createdBy: response.data.created_by,
        updatedAt: response.data.updated_at ? new Date(response.data.updated_at).toISOString() : undefined,
        updatedBy: response.data.updated_by
      };
      
      return convertedData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ana şirketi getirirken bir hata oluştu';
      setError(errorMessage);
      console.error('Ana şirketi getirirken hata:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Yeni ana şirket oluştur
  const createParentCompany = useCallback(async (companyData: Partial<MainCompany>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // MainCompany tipini PostgreSQL modeline dönüştür
      const convertedData = {
        name: companyData.name,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        tax_id: companyData.flowId,
        notes: companyData.notes,
        is_active: true,
        created_by: companyData.createdBy || 'system',
        updated_by: companyData.updatedBy || 'system'
      };
      
      const response = await axios.post(`/franchisemanager/api/parent-companies`, convertedData);
      
      // PostgreSQL yanıtını MainCompany tipine dönüştür
      const newCompany: MainCompany = {
        id: response.data.id,
        name: response.data.name,
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        flowId: response.data.tax_id || '',
        notes: response.data.notes || '',
        createdAt: new Date(response.data.created_at).toISOString(),
        createdBy: response.data.created_by,
        updatedAt: response.data.updated_at ? new Date(response.data.updated_at).toISOString() : undefined,
        updatedBy: response.data.updated_by
      };
      
      // Store'a ekle
      addMainCompany(newCompany);
      
      return newCompany;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ana şirket oluşturulurken bir hata oluştu';
      setError(errorMessage);
      console.error('Ana şirket oluşturulurken hata:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addMainCompany]);

  // Ana şirketi güncelle
  const updateParentCompanyById = useCallback(async (id: string, companyData: Partial<MainCompany>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // MainCompany tipini PostgreSQL modeline dönüştür
      const convertedData = {
        name: companyData.name,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        tax_id: companyData.flowId,
        notes: companyData.notes,
        updated_by: companyData.updatedBy || 'system'
      };
      
      const response = await axios.put(`/franchisemanager/api/parent-companies/${id}`, convertedData);
      
      // PostgreSQL yanıtını MainCompany tipine dönüştür
      const updatedCompany: MainCompany = {
        id: response.data.id,
        name: response.data.name,
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        flowId: response.data.tax_id || '',
        notes: response.data.notes || '',
        createdAt: new Date(response.data.created_at).toISOString(),
        createdBy: response.data.created_by,
        updatedAt: response.data.updated_at ? new Date(response.data.updated_at).toISOString() : undefined,
        updatedBy: response.data.updated_by
      };
      
      // Store'u güncelle
      updateMainCompany(updatedCompany);
      
      return updatedCompany;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ana şirket güncellenirken bir hata oluştu';
      setError(errorMessage);
      console.error('Ana şirket güncellenirken hata:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateMainCompany]);

  // Ana şirketi sil
  const deleteParentCompanyById = useCallback(async (id: string, deletedBy: string = 'system') => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/franchisemanager/api/parent-companies/${id}`, {
        data: { deleted_by: deletedBy }
      });
      
      // Store'dan sil
      deleteMainCompany(id);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ana şirket silinirken bir hata oluştu';
      setError(errorMessage);
      console.error('Ana şirket silinirken hata:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deleteMainCompany]);

  // İlk yüklemede ana şirketleri getir
  useEffect(() => {
    if (initialLoad) {
      fetchParentCompanies({ limit, offset });
    }
  }, [initialLoad, fetchParentCompanies, limit, offset]);

  return {
    parentCompanies: mainCompanies,
    total,
    isLoading,
    error,
    fetchParentCompanies,
    fetchParentCompany,
    createParentCompany,
    updateParentCompanyById,
    deleteParentCompanyById
  };
}
