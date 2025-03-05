import { useTabStore } from '@/stores/tab-store';
import { useFilterStore } from '@/stores/filters-store';
import { toZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';

export function useTab() {
    const addTab = useTabStore((state) => state.addTab);
    const setFilter = useFilterStore((state) => state.setFilter);

    const getDefaultFilter = () => ({
        date: {
            from: toZonedTime(new Date(new Date().setHours(0, 0, 0, 0)), 'Europe/Istanbul'),
            to: toZonedTime(addDays(new Date().setHours(23, 59, 59, 999), 1), 'Europe/Istanbul')
        },
        branches: [],
        selectedBranches: [],
        selectedDateRange: 'today'
    });

    const handleTabOpen = (id: string, title: string) => {
        const currentFilter = useFilterStore.getState().selectedFilter;
        const existingTab = useTabStore.getState().tabs.find(tab => tab.id === id);
        
        if (existingTab) {
            useTabStore.getState().setActiveTab(id);
            // Get existing tab's filter but preserve current branch selection
            const tabFilter = useTabStore.getState().getTabFilter(id);
            if (tabFilter) {
                setFilter({
                    ...tabFilter,
                    branches: currentFilter.branches,
                    selectedBranches: currentFilter.selectedBranches
                });
            } else {
                // If tab has no filter, create new one with current branch selection
                const newFilter = {
                    ...getDefaultFilter(),
                    branches: currentFilter.branches,
                    selectedBranches: currentFilter.selectedBranches
                };
                useTabStore.getState().setTabFilter(id, newFilter);
                setFilter(newFilter);
            }
        } else {
            // For new tab, create default filter but preserve branch selection
            const defaultFilter = {
                ...getDefaultFilter(),
                branches: currentFilter.branches,
                selectedBranches: currentFilter.selectedBranches
            };
            
            addTab({
                id,
                title,
                filter: defaultFilter,
                lazyComponent: () => import(`@/app/[tenantId]/(main)/${id}/page`),
            });
            
            setFilter(defaultFilter);
        }
    };

    return { handleTabOpen };
}