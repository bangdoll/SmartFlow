export function publicCacheHeaders(maxAge: number, staleWhileRevalidate: number) {
    const policy = `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

    return {
        'Cache-Control': `public, max-age=0, ${policy}`,
        'CDN-Cache-Control': policy,
        'Vercel-CDN-Cache-Control': policy,
    };
}
