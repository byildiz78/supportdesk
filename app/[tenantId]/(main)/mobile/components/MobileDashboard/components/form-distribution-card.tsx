"use client"

import { FormDistributionChart } from "@/app/[tenantId]/(main)/dashboard/components/form-distribution-chart";
import { useAuditDistribution } from "@/hooks/useAuditDistribution";
import { useTabStore } from "@/stores/tab-store";

interface FormDistributionCardProps {
  branches: number[];
  date: string;
  refreshTrigger?: number;
}

export function FormDistributionCard({ branches, date, refreshTrigger }: FormDistributionCardProps) {
  const { activeTab } = useTabStore();
  const { data, isLoading, error } = useAuditDistribution(activeTab === "dashboard" ? { branches, date, refreshTrigger } : null);

  return (
    <div className="lg:col-span-3">
      <div className="rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50 shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 p-6">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Form Dağılımı
          </h3>
          {!isLoading && !error && data.length > 0 && (
            <p className="text-[0.925rem] text-muted-foreground">
              Denetimlerde kullanılan formların dağılımı
            </p>
          )}
        </div>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-red-500">
                Hata Oluştu
              </h3>
              <p className="text-[0.925rem] text-muted-foreground">
                {error}
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Veri bulunamadı
            </div>
          ) : (
            <FormDistributionChart data={data} />
          )}
        </div>
      </div>
    </div>
  )
}