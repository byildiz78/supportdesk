import { WebWidgetData } from '@/types/tables'
import { create } from 'zustand'

interface WebWidgetDataState {
    widgetDatas: WebWidgetData[],
    branchDatas: WebWidgetData[],
    setWidgetDatas: (widgetDatas: WebWidgetData[]) => void,
    setBranchDatas: (branchDatas: WebWidgetData[]) => void,
    addOrReplaceWidgetData: (widgetData: WebWidgetData) => void,
    addOrReplaceBranchData: (branchData: WebWidgetData) => void
}

export const useWidgetDataStore = create<WebWidgetDataState>((set) => ({
    widgetDatas: [],
    branchDatas: [],
    setWidgetDatas: (widgetDatas: WebWidgetData[]) => {
        set(() => ({
            widgetDatas: widgetDatas
        }));
    },
    setBranchDatas: (branchDatas: WebWidgetData[]) => {
        set(() => ({
            branchDatas: branchDatas
        }));
    },
    addOrReplaceWidgetData: (widgetData: WebWidgetData) =>
        set((state) => {
            const existingIndex = state.widgetDatas.findIndex(
                data => data.ReportID === widgetData.ReportID
            );

            if (existingIndex !== -1) {
                const updatedWidgetDatas = [...state.widgetDatas];
                updatedWidgetDatas[existingIndex] = widgetData;
                return { widgetDatas: updatedWidgetDatas };
            } else {
                return { widgetDatas: [...state.widgetDatas, widgetData] };
            }
        }),
    addOrReplaceBranchData: (branchData: WebWidgetData) =>
        set((state) => {
            const existingIndex = state.branchDatas.findIndex(
                data => data.BranchID === branchData.BranchID
            );

            if (existingIndex !== -1) {
                const updatedBranchDatas = [...state.branchDatas];
                updatedBranchDatas[existingIndex] = branchData;
                return { branchDatas: updatedBranchDatas };
            } else {
                return { branchDatas: [...state.branchDatas, branchData] };
            }
        }),
}))
