import { ThemeProvider } from "@/providers/theme-provider";
import { LanguageProvider } from "@/providers/language-provider";
import { Toaster } from "@/components/ui/toast/toaster";
import "./globals.css";
import { Metadata, Viewport } from "next";


export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export const metadata: Metadata = {
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'format-detection': 'telephone=no',
    },
    icons: {
        icon: `${process.env.NEXT_PUBLIC_BASEPATH}/favicon.ico`,
        shortcut: `${process.env.NEXT_PUBLIC_BASEPATH}/favicon.ico`,
        apple: `${process.env.NEXT_PUBLIC_BASEPATH}/favicon.ico`,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full antialiased">
            <head>
                <meta name="theme-color" content="#ffffff" />
            </head>
            <body className={`h-full overflow-auto`}>
                <ThemeProvider
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <LanguageProvider>
                        {children}
                        <Toaster />
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
