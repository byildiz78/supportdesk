import { Bot, Sparkles } from 'lucide-react';

export function LoadingAnimation() {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative w-24 h-24">
            {/* Outer spinning circle */}
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>

            {/* Inner pulsing bot icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
        </div>

        <div className="space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Yapay Zeka Analizi Yapılıyor
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4 animate-pulse text-yellow-500" />
                <span>Veriler işleniyor ve analiz ediliyor...</span>
            </div>
        </div>

        {/* Animated progress bar */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x"></div>
        </div>
    </div>
    );
}
