import { NextResponse } from 'next/server';

interface RateLimitOptions {
    name: string;
    limit: number;
    windowMs: number;
}

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 2_000;

function getClientIdentifier(request: Request): string {
    const cloudflareIp = request.headers.get('cf-connecting-ip');
    if (cloudflareIp) return cloudflareIp;

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    const forwardedFor = request.headers.get('x-forwarded-for');
    return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

function pruneExpiredBuckets(now: number) {
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

/**
 * Lightweight per-instance burst protection for public, cost-incurring APIs.
 * A distributed limiter should still be added at the edge if traffic grows.
 */
export function rateLimit(request: Request, options: RateLimitOptions): NextResponse | null {
    const now = Date.now();
    pruneExpiredBuckets(now);

    const key = `${options.name}:${getClientIdentifier(request)}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
        if (buckets.size >= MAX_BUCKETS) buckets.clear();
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return null;
    }

    if (current.count >= options.limit) {
        const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        return NextResponse.json(
            { error: '請求過於頻繁，請稍後再試。' },
            {
                status: 429,
                headers: {
                    'Cache-Control': 'no-store',
                    'Retry-After': String(retryAfter),
                },
            },
        );
    }

    current.count += 1;
    return null;
}
