import { ProjectSettings } from '@/types/tables'
import { create } from 'zustand'


interface SettingsState {
  settings: ProjectSettings[],
  setSettings: (widgets: ProjectSettings[]) => void
  addSetting: (widget: ProjectSettings) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: [],
    setSettings: (settings: ProjectSettings[]) =>
    set(() => ({
        settings: settings
    })),
    addSetting: (setting: ProjectSettings) =>
        set((state) => ({
            settings: {
                ...state.settings,
                branches: [...state.settings, setting]
            }
        })),
}))