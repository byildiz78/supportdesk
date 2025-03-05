/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.NEXT_PUBLIC_BASEPATH,
    assetPrefix: process.env.NEXT_PUBLIC_BASEPATH,
    reactStrictMode: false,
    i18n: {
      locales: ['en', 'tr'],
      defaultLocale: 'tr',
    },
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        optimizeCss: false, // Disable CSS optimization temporarily
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
    async headers() {
        return [
         {
            source: '/:path*',
            headers: [
             {
                key: 'Content-Security-Policy',
                value: "frame-src 'self' http: https:;"
             }
            ],
         },
        ]
    },
};
 
export default nextConfig; 