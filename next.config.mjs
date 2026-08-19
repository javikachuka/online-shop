/** @type {import('next').NextConfig} */
const nextConfig = {
    // Swiper (thumbs gallery) se rompe con el doble montaje de efectos de Strict Mode en desarrollo
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com'
            }
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        minimumCacheTTL: 60 * 60 * 24 * 30
    },
    // Permitir tunnels de desarrollo para Server Actions
    experimental: {
        serverActions: {
            allowedOrigins: [
                'localhost:3000',
                '39sm45kg-3000.brs.devtunnels.ms', // Tu tunnel específico
                '*.devtunnels.ms', // Cualquier devtunnel
                '*.ngrok.io' // Si usas ngrok
            ]
        }
    }
};

export default nextConfig;
