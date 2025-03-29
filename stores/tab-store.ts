// stores/tab-store.ts
import { create } from 'zustand';

interface Tab {
  id: string;
  title: string;
  url?: string;
  filter?: any;
  props?: any;
  lazyComponent: () => Promise<{ default: React.ComponentType<any> }>;
}

interface TabStore {
  tabs: Tab[];
  activeTab: string;
  previousActiveTab: string | null;
  renderedComponents: { [key: string]: React.ReactNode };
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  removeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  setTabFilter: (id: string, filter: any) => void;
  getTabFilter: (id: string) => any;
  getTabProps: (id: string) => any;
  setRenderedComponent: (id: string, component: React.ReactNode) => void;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTab: 'dashboard',
  previousActiveTab: null,
  renderedComponents: {},
  addTab: (tab) => {
    // Bilet detayına geçildiğinde önceki aktif tabı sakla
    const currentActiveTab = get().activeTab;
    // Bilet detayı kontrolü: ticket- veya ticket-detail- ile başlayan veya sayısal değer olan ID'ler
    const isTicketDetail = tab.id.startsWith('ticket-') || 
                          tab.id.startsWith('ticket-detail-') || 
                          /^\d+$/.test(tab.id);
    
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTab: tab.id,
      // Eğer bilet detayı kapatılıyorsa ve başka bir bilet detayına geçilmiyorsa, previousActiveTab'i null yap
      previousActiveTab: isTicketDetail ? currentActiveTab : state.previousActiveTab,
    }));
  },
  removeTab: (id) =>
    set((state) => ({
      tabs: state.tabs.filter((tab) => tab.id !== id),
      renderedComponents: {
        ...state.renderedComponents,
        [id]: undefined,
      },
      // Eğer bilet detayı kapatılıyorsa ve başka bir bilet detayına geçilmiyorsa, previousActiveTab'i null yap
      previousActiveTab: id.startsWith('ticket-') || id.startsWith('ticket-detail-') || /^\d+$/.test(id)
        ? (state.activeTab.startsWith('ticket-') || state.activeTab.startsWith('ticket-detail-') || /^\d+$/.test(state.activeTab)
            ? state.previousActiveTab 
            : null)
        : state.previousActiveTab,
    })),
  removeAllTabs: () =>
    set((state) => ({
      tabs: [],
      activeTab: 'dashboard',
      previousActiveTab: null,
      renderedComponents: {},
    })),
  setActiveTab: (id) => set({ activeTab: id }),
  setTabFilter: (id, filter) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, filter } : tab
      ),
    })),
  getTabFilter: (id) => {
    const tab = get().tabs.find((tab) => tab.id === id);
    return tab?.filter;
  },
  getTabProps: (id) => {
    const tab = get().tabs.find((tab) => tab.id === id);
    return tab?.props;
  },
  setRenderedComponent: (id, component) =>
    set((state) => ({
      renderedComponents: {
        ...state.renderedComponents,
        [id]: component,
      },
    })),
}));
