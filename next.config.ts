import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const articleCache = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
    const tagCache = 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/news/:id',
        headers: [
          { key: 'Cache-Control', value: articleCache },
          { key: 'CDN-Cache-Control', value: articleCache },
          { key: 'Vercel-CDN-Cache-Control', value: articleCache },
        ],
      },
      {
        source: '/tags/:tag',
        headers: [
          { key: 'Cache-Control', value: tagCache },
          { key: 'CDN-Cache-Control', value: tagCache },
          { key: 'Vercel-CDN-Cache-Control', value: tagCache },
        ],
      },
      {
        source: '/feed.xml',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
    ]
  },
};

export default nextConfig;
