import { Bot, Calendar, Building2, ListFilter, ArrowRight } from "lucide-react";

const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-block p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <Bot className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Yapay Zeka Analizine Hoş Geldiniz
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Analiz başlatmak için lütfen aşağıdaki adımları takip edin
                </p>
            </div>

            {/* Steps */}
            <div className="space-y-6">
                <div className="group flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-white dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl border border-blue-100/50 dark:border-slate-600/50 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-slate-500">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm group-hover:scale-110 transition-transform">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">1. Tarih Aralığı</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Üst menüden analiz yapmak istediğiniz tarih aralığını seçin
                        </p>
                    </div>
                </div>

                <div className="group flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-white dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl border border-blue-100/50 dark:border-slate-600/50 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-slate-500">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm group-hover:scale-110 transition-transform">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">2. Şube Seçimi</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Üst menüden analiz yapmak istediğiniz şubeleri seçin
                        </p>
                    </div>
                </div>

                <div className="group flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-white dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl border border-blue-100/50 dark:border-slate-600/50 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-slate-500">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm group-hover:scale-110 transition-transform">
                        <ListFilter className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">3. Analiz Türü</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Sol menüden yapmak istediğiniz analiz türünü seçin
                        </p>
                    </div>
                </div>
            </div>

            {/* Arrow indicator pointing to sidebar */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg shadow-lg animate-bounce">
                    <ArrowRight className="w-6 h-6 -rotate-45" />
                    <span className="text-sm font-medium whitespace-nowrap">Analiz Seçin</span>
                </div>
            </div>
        </div>
    </div>
);

export default WelcomeScreen;