import { ReactElement } from 'react'

export interface MenuItem {
    id: string
    title: string
    icon: ReactElement
    bgColor: string
    textColor: string
}

export interface BalanceInfo {
    currency: string
    total_balance: string
    granted_balance: string
    topped_up_balance: string
}

export interface Balance {
    is_available: boolean
    balance_infos: BalanceInfo[]
}

export interface Message {
    role: 'assistant'
    content: string
}

export interface FilterData {
    date: {
        from: string
        to: string
    }
    selectedBranches: Array<{ BranchID: string; BranchName: string }>
    branches: Array<{ BranchID: string; BranchName: string }>
}
