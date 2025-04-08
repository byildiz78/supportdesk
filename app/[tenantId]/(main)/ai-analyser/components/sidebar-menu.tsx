import { MenuItem } from '../types'

interface SidebarMenuProps {
    menuItems: MenuItem[]
    selectedMenu: string | null
    isLoading: boolean
    onMenuSelect: (menuId: string) => void
}

export function SidebarMenu({ menuItems, selectedMenu, isLoading, onMenuSelect }: SidebarMenuProps) {
    return (
        <div className="w-64 bg-white dark:bg-slate-800 shadow-lg transition-all overflow-y-auto
        border-r border-gray-200 dark:border-slate-700
        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-thumb]:bg-gray-300/50
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-track]:bg-transparent
        dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
        dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onMenuSelect(item.id)}
                    className={`w-full p-4 text-left flex items-center gap-2 transition-colors
                    ${selectedMenu === item.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-4 border-blue-500'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                    disabled={isLoading}
                >
                    <div className={`${selectedMenu === item.id
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.icon}
                    </div>
                    <span>{item.title}</span>
                </button>
            ))}
        </div>
    )
}
