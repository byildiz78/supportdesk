import { formatDateTimeDMY } from '@/lib/utils';
import { useFilterStore } from '@/stores/filters-store';
import { Building2, Calendar, PlayCircle } from 'lucide-react';

export function FilterInfo({ selectedMenu, isLoading, handleAnalyze }: any) {
    const { selectedFilter } = useFilterStore()

    return (
        <div className="bg-gradient-to-r from-blue-50 to-white dark:from-slate-700/50 dark:to-slate-800 rounded-lg p-4 border border-blue-100 dark:border-slate-600">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-md shadow-sm">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {formatDateTimeDMY(selectedFilter.date.from)} - {formatDateTimeDMY(selectedFilter.date.to)}
                </div>
                {selectedMenu && !isLoading && (
                    <>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <button
                            onClick={() => handleAnalyze(selectedMenu)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors shadow-sm hover:shadow-md"
                            disabled={isLoading}
                        >
                            <PlayCircle className="w-4 h-4" />
                            Analizi Başlat
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
