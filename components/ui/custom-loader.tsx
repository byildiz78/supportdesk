interface CustomLoaderProps {
    message?: string;
    description?: string;
}

export function CustomLoader({ 
    message = "Yükleniyor", 
    description = "Veriler hazırlanıyor..." 
}: CustomLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-20 h-20">
                {/* Outer circle */}
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500/30 border-b-blue-500/10 border-l-blue-500/50 animate-[spin_1.5s_linear_infinite]" />
                {/* Inner circle */}
                <div className="absolute inset-3 rounded-full border-4 border-l-blue-500/50 border-t-blue-500/20 border-b-blue-500/80 border-r-blue-500/40 animate-[spin_2s_linear_infinite_reverse]" />
                {/* Center dot */}
                <div className="absolute inset-[30%] bg-gradient-to-tr from-blue-500/80 to-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="mt-6 text-center">
                <div className="text-lg font-medium text-gray-600 dark:text-gray-300">{message}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
            </div>
        </div>
    );
}
