import { CreditCard, Wallet } from 'lucide-react'
import { Balance } from '../types'

interface BalanceCardProps {
    balanceData: Balance
}

export function BalanceCard({ balanceData }: BalanceCardProps) {
    if (!balanceData.is_available) return null

    return (
        <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Bakiye Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balanceData.balance_infos.map((balance, idx) => (
                <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {balance.currency}
                        </span>
                        <div className="bg-blue-500/10 rounded-full px-2 py-1">
                            <Wallet className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Bakiye</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {balance.total_balance}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-blue-800">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hediye</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {balance.granted_balance}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Yüklenen</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {balance.topped_up_balance}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    )
}
