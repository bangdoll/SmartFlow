import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const articleCache = 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600';
    const tagCache = 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600';

    return [
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
