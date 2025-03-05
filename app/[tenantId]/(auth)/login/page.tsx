"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { LockKeyhole, User, Loader2, ShieldCheck, BarChart3, Globe2, Sun, Moon, Eye, EyeOff, Mail, Currency, LucideCurrency, HandCoins } from "lucide-react";
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
    const [isMobile, setIsMobile] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [bgImageLoaded, setBgImageLoaded] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const ua = navigator.userAgent;
            setIsMobile(
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
                window.innerWidth <= 768
            );
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const pathSegments = pathname?.split("/") || [];
        if (pathSegments.length > 1) {
            const tenant = pathSegments[1];
            const formattedName = tenant
                .split(/(?=[A-Z])|(?=[0-9])/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
            setTenantName(formattedName);
            document.title = `${formattedName} - ${process.env.NEXT_PUBLIC_APP_NAME}`;
        }
    }, [pathname]);

    useEffect(() => {
        // Expo token'ını dinle
        const handleExpoToken = async (event: any) => {
            const data = event.data;
            try {
                if (typeof data === 'string') {
                    const parsedData = JSON.parse(data);
                    if (parsedData.type === 'expoToken') {
                        // Token'ı API'ye gönder
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
                console.error('Expo token kaydetme hatası:', error);
            }
        };

        window.addEventListener('message', handleExpoToken);
        return () => window.removeEventListener('message', handleExpoToken);
    }, []);

    useEffect(() => {
        // Arka plan resmini önceden yükle
        const img = document.createElement('img');
        img.src = `${process.env.NEXT_PUBLIC_BASEPATH}/images/background/background1.jpg`;
        img.onload = () => setBgImageLoaded(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Login isteği
            const response = await axios.post("/api/auth/login", formData, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const tenantId = pathname?.split('/')[1];

                // Settings'i al
                try {
                    const settingsResponse = await axios.get('/api/get-user-settings');
                    const settings = {
                        minDiscountAmount: settingsResponse.data.minDiscountAmount ?? 0,
                        minCancelAmount: settingsResponse.data.minCancelAmount ?? 0,
                        minSaleAmount: settingsResponse.data.minSaleAmount ?? 0
                    };

                    // Settings ve kullanıcı bilgilerini localStorage'a kaydet
                    localStorage.setItem(`userData_${tenantId}`, JSON.stringify({
                        name: response.data.name,
                        email: response.data.email,
                        userId: response.data.userId,
                        username: response.data.username,
                        usercategory: response.data.userCategory,
                        settings: settings
                    }));
                } catch (error) {
                    localStorage.setItem(`userData_${tenantId}`, JSON.stringify({
                        name: response.data.name,
                        email: response.data.email,
                        userId: response.data.userId,
                        username: response.data.username,
                        usercategory: response.data.usercategory,
                        settings: {
                            minDiscountAmount: 0,
                            minCancelAmount: 0,
                            minSaleAmount: 0
                        }
                    }));
                }

                // Yönlendirme animasyonu
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
            setError("Şifre sıfırlama işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const features = [
        {
            icon: BarChart3,
            title: "Cari Hesap Takibi",
            description: "Anlık borç ve alacak takibi",
            gradient: "from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
        },
        {
            icon: ShieldCheck,
            title: "Güvenli İşlemler",
            description: "Güvenli finansal veri yönetimi",
            gradient: "from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700"
        },
        {
            icon: Globe2,
            title: "Her Yerden Erişim",
            description: "Tüm cihazlardan kolay erişim",
            gradient: "from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700"
        },
    ];

    return (
        <div
            className={cn(
                "min-h-screen w-full flex flex-col items-center justify-between relative overflow-hidden",
                bgImageLoaded ? `bg-[url('${process.env.NEXT_PUBLIC_BASEPATH ?? 'PathNull'}/images/background/background1.jpg')] dark:bg-gray-900 bg-cover bg-center bg-no-repeat` : "bg-gray-900",
                "transition-all duration-300"
            )}
        >
            {/* Preload image */}
            <Image
                src={`${process.env.NEXT_PUBLIC_BASEPATH}/images/background/background1.jpg`}
                alt="RobotPOS Background"
                fill
                priority
                className="object-cover"
            />

            {/* Noise overlay */}
            <div className={`fixed inset-0 bg-[url('${process.env.NEXT_PUBLIC_BASEPATH ?? ''}/images/background/noise.png')] opacity-10 mix-blend-overlay pointer-events-none`} />

            {/* Dark theme overlay */}
            <div className="fixed inset-0 bg-black/5 dark:bg-black/5 pointer-events-none" />

            {/* Gradient Orbs with reduced opacity */}
            <div className="fixed -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px] animate-pulse-slow pointer-events-none" />
            <div className="fixed -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-secondary/5 dark:bg-secondary/10 blur-[120px] animate-pulse-slow pointer-events-none" />
            <div className="fixed left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/5 dark:bg-accent/10 blur-[100px] animate-pulse pointer-events-none" />

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed right-4 top-4 h-10 w-10 rounded-full bg-background/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Logo */}
            <div className="absolute left-4 top-4 lg:left-8 lg:top-8 md:ml-[4rem] sm:block hidden">
                <div className="relative h-12 w-48 transition-all duration-300 hover:scale-105">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_BASEPATH ?? 'PathNull'}/images/robotpos-logo.png`}
                        alt="RobotPOS Logo"
                        fill
                        priority
                        sizes="(max-width: 768px) 150px, 192px"
                        className="object-contain dark:brightness-110 dark:contrast-125"
                    />
                </div>
            </div>

            {/* Mobile Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 sm:hidden block">
                <div className="relative h-10 w-40 transition-all duration-300">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_BASEPATH ?? 'PathNull'}/images/robotpos-logo.png`}
                        alt="RobotPOS Logo"
                        fill
                        priority
                        sizes="(max-width: 768px) 150px, 192px"
                        className="object-contain dark:brightness-110 dark:contrast-125"
                    />
                </div>
            </div>

            <div className="container relative mx-auto flex flex-col justify-between min-h-screen px-4 py-4">
                <div className="flex flex-col items-center flex-1">
                    {/* Main content wrapper with vertical centering */}
                    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-6xl mx-auto">
                        {/* Tenant Name with new styling */}
                        <div className="mt-16 sm:mt-0 mb-4 text-center">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 via-transparent to-secondary/15 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] dark:text-white dark:drop-shadow-[0_4px_4px_rgba(0,0,0,1)] [text-shadow:_2px_2px_0_rgb(0_0_0_/_40%)]">
                                    {tenantName}
                                </h1>
                            </div>
                        </div>

                        {/* Data Manager Section */}
                        <div className="mb-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-secondary/15 via-transparent to-primary/15 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <div className="relative flex flex-col items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/5 ring-2 ring-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.8)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.8)] transition-all duration-300">
                                            <HandCoins className="h-7 w-7 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] [filter:_drop-shadow(0_0_4px_rgba(255,255,255,0.4))]" />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] dark:text-white dark:drop-shadow-[0_4px_4px_rgba(0,0,0,1)] [text-shadow:_2px_2px_0_rgb(0_0_0_/_40%)]">
                                            {process.env.NEXT_PUBLIC_APP_NAME}
                                        </h2>
                                    </div>
                                    <p className="text-lg text-white/90 text-center font-medium md:block hidden">
                                        Kolay ve hızlı online müşteri hesap yönetimi
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section - Login Form */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md"
                        >
                            <Card className={cn(
                                "border border-white/20 dark:border-gray-700 shadow-2xl",
                                "bg-white/10 dark:bg-gray-800/90 backdrop-blur-md",
                                shake && "animate-shake"
                            )}>
                                <CardHeader className="space-y-1 text-center pb-4">
                                    <h2 className="text-2xl font-semibold text-white dark:text-gray-100 tracking-tight">
                                        Hoş Geldiniz
                                    </h2>
                                    <p className="text-sm text-gray-200 dark:text-gray-400">
                                        Devam etmek için giriş yapın
                                    </p>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-4">
                                        {error && (
                                            <Alert variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="text-white dark:text-gray-200">
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
                                                        "pl-10 h-12",
                                                        "bg-white/10 dark:bg-gray-900/50",
                                                        "border-white/20 dark:border-gray-700",
                                                        "text-white dark:text-gray-100",
                                                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                                        "focus:border-blue-500/50 focus:ring-blue-500/20"
                                                    )}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-white dark:text-gray-200">
                                                Şifre
                                            </Label>
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
                                                        "pl-10 pr-12 h-12",
                                                        "bg-white/10 dark:bg-gray-900/50",
                                                        "border-white/20 dark:border-gray-700",
                                                        "text-white dark:text-gray-100",
                                                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                                        "focus:border-blue-500/50 focus:ring-blue-500/20"
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

                                        {/* Forgot Password Link */}
                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="link"
                                                    className="text-sm text-gray-200 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 p-0 h-auto font-normal"
                                                >
                                                    Şifrenizi mi unuttunuz?
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Şifre Sıfırlama</DialogTitle>
                                                    <DialogDescription>
                                                        E-posta adresinizi girin, size şifre sıfırlama talimatlarını gönderelim.
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
                                                                placeholder="ornek@email.com"
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
                                                                "Şifre Sıfırlama Bağlantısı Gönder"
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className={cn(
                                                "w-full h-12 text-base font-medium",
                                                "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
                                                "text-white",
                                                "transition-all duration-300",
                                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                                "transform hover:scale-[1.02] active:scale-95"
                                            )}
                                            disabled={isLoading}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isLoading ? (
                                                    <motion.div
                                                        key="loading"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        className="flex items-center"
                                                    >
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Giriş yapılıyor...
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="login"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                    >
                                                        Giriş Yap
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Section - Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-6xl mx-auto hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto mb-10"
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="backdrop-blur-md bg-white/5 dark:bg-gray-800/5 rounded-xl px-6 py-4 border border-white/10 dark:border-gray-700/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-4"
                        >
                            <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                                <feature.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-white dark:text-gray-200">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-300 dark:text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}