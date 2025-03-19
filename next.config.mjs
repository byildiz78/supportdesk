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
    webpack: (config, { isServer }) => {
        // Node.js modüllerini tarayıcı tarafında kullanmamak için
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                path: false,
                os: false,
                crypto: false,
                stream: false,
                net: false,
                tls: false,
                dns: false,
                child_process: false,
                url: false,
                util: false,
                buffer: false,
                querystring: false,
                assert: false,
                http: false,
                https: false,
                zlib: false,
                constants: false,
                events: false,
                punycode: false,
            };
        }
        return config;
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