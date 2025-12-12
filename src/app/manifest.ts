import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '智流 Smart Flow',
        short_name: '智流',
        description: '每日自動擷取全球 AI 新聞，提供中英文摘要與電子報服務。',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#2563eb',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }
}
