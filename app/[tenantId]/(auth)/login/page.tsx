"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { LockKeyhole, User, Loader2, Shield, Sun, Moon, Eye, EyeOff, Mail, ChevronRight, Building, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import axios, { isAxiosError } from "@/lib/axios";

export default function LoginPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [tenantName, setTenantName] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
    const [error, setError] = useState<string>("");
    const [shake, setShake] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const pathSegments = pathname?.split("/") || [];
        if (pathSegments.length > 1) {
            const tenant = pathSegments[1];
            const formattedName = tenant
                .split(/(?=[A-Z])|(?=[0-9])/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
            setTenantName(formattedName);
            document.title = `${formattedName} - Giriş`;
        }
    }, [pathname]);

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Expo token handling
        const handleExpoToken = async (event: any) => {
            const data = event.data;
            try {
                if (typeof data === 'string') {
                    const parsedData = JSON.parse(data);
                    if (parsedData.type === 'expoToken') {
                        // Send token to API
                        await fetch('/api/expo/savetoken', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userId: parsedData.userId,
                                expoToken: parsedData.token
                            }),
                        });
                    }
                }
            } catch (error) {
                console.error('Expo token save error:', error);
            }
        };

        window.addEventListener('message', handleExpoToken);
        return () => window.removeEventListener('message', handleExpoToken);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Login request
            const response = await axios.post("/api/auth/login", formData, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const tenantId = pathname?.split('/')[1];

                // Get settings
                try {
                    // Save user data to localStorage
                    localStorage.setItem(`userData_${tenantId}`, JSON.stringify({
                        name: response.data.name,
                        email: response.data.email,
                        userId: response.data.userId,
                        username: response.data.username,
                        usercategory: response.data.userCategory,
                    }));
                    
                    // Save userId globally
                    localStorage.setItem('userId', response.data.userId);
                } catch (error) {
                    localStorage.setItem(`userData_${tenantId}`, JSON.stringify({
                        name: response.data.name,
                        email: response.data.email,
                        userId: response.data.userId,
                        username: response.data.username,
                        usercategory: response.data.usercategory,
                    }));
                    
                    // Save userId globally
                    localStorage.setItem('userId', response.data.userId);
                }

                // Redirect animation
                const button = document.querySelector('button[type="submit"]');
                if (button) {
                    button.classList.add('scale-95', 'opacity-80');
                    setTimeout(() => {
                        button.classList.add('scale-0', 'opacity-0');
                        setTimeout(() => {
                            router.push(`/${pathname?.split("/")[1]}`);
                        }, 300);
                    }, 200);
                } else {
                    router.push(`/${pathname?.split("/")[1]}`);
                }
            }
        } catch (error) {
            if (isAxiosError(error)) {
                setError(error.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
            } else {
                setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            }
            setShake(true);
            setTimeout(() => setShake(false), 650);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setForgotPasswordLoading(true);
        setError("");

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setForgotPasswordSuccess(true);
            setTimeout(() => {
                setIsDialogOpen(false);
                setForgotPasswordSuccess(false);
                setForgotPasswordEmail("");
            }, 2000);
        } catch (error) {
            setError("Şifre sıfırlama başarısız oldu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // Format current time
    const formattedTime = currentTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const formattedDate = currentTime.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });

    return (
        <div className="min-h-screen w-full bg-white dark:bg-gray-950 relative overflow-hidden">
            {/* Full page background video/image with darkened overlay */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src={`${process.env.NEXT_PUBLIC_BASEPATH}/images/background/background1.jpg`} 
                    alt="Arka Plan" 
                    fill 
                    priority 
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-[2px]"></div>
            </div>

            {/* Theme switcher */}
            <Button
                variant="outline"
                size="icon"
                className="absolute right-6 top-6 z-50 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Tema değiştir</span>
            </Button>

            {/* Main content */}
            <div className="min-h-screen w-full flex items-center justify-center p-6 z-10 relative">
                <div className="w-full max-w-7xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10" style={{ maxHeight: "90vh" }}>
                    {/* Left panel - Branding and visuals */}
                    <div className="w-full lg:w-7/12 relative text-white p-6 lg:p-10 flex flex-col justify-between overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                        
                        {/* Top section with company info */}
                        <div className="relative mb-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg">
                                    <Building className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">{ process.env.NEXT_PUBLIC_APP_NAME || "Şirket Portalı"}</h1>
                                    <p className="text-white/70 text-sm">Kurumsal Ticket Yönetim Sistemi</p>
                                </div>
                            </div>

                            <div className="max-w-lg">
                                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                                    İş süreçlerinizi yönetin, <span className="text-blue-400">verimliliği artırın</span>
                                </h2>
                                <p className="text-white/80 text-base mb-4">
                                    Modern arayüz ve gelişmiş özelliklerle donatılmış kurumsal ticket yönetim sistemimiz ile işletmenizin tüm ihtiyaçlarını tek platformda karşılayın.
                                </p>
                            </div>
                        </div>
                        
                        {/* Bottom section with time and features */}
                        <div className="relative mt-auto pt-8 border-t border-white/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-400" />
                                        <span className="text-2xl font-semibold">{formattedTime}</span>
                                    </div>
                                    <p className="text-white/60">{formattedDate}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                                            <path d="m9 12 2 2 4-4"></path>
                                        </svg>
                                    </div>
                                    <h3 className="font-medium mb-1">Güvenli Erişim</h3>
                                    <p className="text-white/60 text-sm">Çift faktörlü kimlik doğrulama ile güçlendirilmiş güvenlik</p>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"></path>
                                            <path d="M12 8v4l3 3"></path>
                                        </svg>
                                    </div>
                                    <h3 className="font-medium mb-1">Gerçek Zamanlı</h3>
                                    <p className="text-white/60 text-sm">Anlık bildirimler ve güncel veriye hızlı erişim</p>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                                            <line x1="6" x2="6" y1="1" y2="4"></line>
                                            <line x1="10" x2="10" y1="1" y2="4"></line>
                                            <line x1="14" x2="14" y1="1" y2="4"></line>
                                        </svg>
                                    </div>
                                    <h3 className="font-medium mb-1">Akıllı Raporlama</h3>
                                    <p className="text-white/60 text-sm">Veriye dayalı iş kararları için analitik araçlar</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right panel - Login form */}
                    <div className="w-full lg:w-5/12 p-6 lg:p-8 bg-white dark:bg-gray-900 flex flex-col justify-center items-center">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Hesabınıza Giriş Yapın
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Güvenli yönetim portalına erişmek için giriş yapın
                                </p>
                            </div>
                            
                            {/* Login Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full"
                            >
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-medium">
                                            Kullanıcı Adı
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="username"
                                                type="text"
                                                inputMode="text"
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                placeholder="Kullanıcı adınızı girin"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className={cn(
                                                    "pl-10 h-12 text-base",
                                                    "bg-gray-50 dark:bg-gray-800/50",
                                                    "border-gray-200 dark:border-gray-700",
                                                    "text-gray-900 dark:text-gray-100",
                                                    "focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                                )}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                                                Şifre
                                            </Label>
                                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="link"
                                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto font-normal"
                                                    >
                                                        Şifremi unuttum
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Şifre Sıfırlama</DialogTitle>
                                                        <DialogDescription>
                                                            E-posta adresinizi girin, şifrenizi sıfırlamak için talimatları göndereceğiz.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="email">E-posta Adresi</Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                                <Input
                                                                    id="email"
                                                                    type="email"
                                                                    placeholder="ad@sirket.com"
                                                                    value={forgotPasswordEmail}
                                                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                                                    className="pl-10"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter className="sm:justify-start">
                                                            <Button
                                                                type="submit"
                                                                disabled={forgotPasswordLoading || forgotPasswordSuccess}
                                                                className="w-full"
                                                            >
                                                                {forgotPasswordLoading ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Gönderiliyor...
                                                                    </>
                                                                ) : forgotPasswordSuccess ? (
                                                                    <>
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="text-green-500"
                                                                        >
                                                                            ✓ Gönderildi
                                                                        </motion.div>
                                                                    </>
                                                                ) : (
                                                                    "Sıfırlama Bağlantısı Gönder"
                                                                )}
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <div className="relative">
                                            <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                inputMode="text"
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                placeholder="Şifrenizi girin"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className={cn(
                                                    "pl-10 pr-12 h-12 text-base",
                                                    "bg-gray-50 dark:bg-gray-800/50",
                                                    "border-gray-200 dark:border-gray-700",
                                                    "text-gray-900 dark:text-gray-100",
                                                    "focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                                )}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                                        />
                                        <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                            Beni hatırla (bu cihaz için)
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className={cn(
                                            "w-full h-12 text-base font-medium mt-2",
                                            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
                                            "text-white",
                                            "transition-all duration-300",
                                            "shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30",
                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                            "transform hover:scale-[1.02] active:scale-95",
                                            shake && "animate-shake"
                                        )}
                                        disabled={isLoading}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isLoading ? (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="flex items-center"
                                                >
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Giriş yapılıyor...
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="login"
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="flex items-center"
                                                >
                                                    Giriş Yap
                                                    <ChevronRight className="ml-2 h-5 w-5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </form>
                            </motion.div>
                            
                            {/* Help & Support */}
                            <div className="mt-10">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                                            Yardıma mı ihtiyacınız var?
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-center gap-6">
                                    <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                                        BT Desteği
                                    </a>
                                    <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                                        Kullanım Kılavuzu
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}