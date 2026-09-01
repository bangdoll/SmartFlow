import { ImageResponse } from 'next/og';
import { publicCacheHeaders } from '@/lib/cache-control';
import { rateLimit } from '@/lib/rate-limit';

const OG_TITLE_FALLBACK = 'AI Trends Daily';
const OG_SOURCE_FALLBACK = 'Smart Flow';

// @vercel/og 只有內建拉丁字型；遇到中文時會嘗試連線到 Google Fonts。
// OG 圖片是快取資產，不能讓一次外部字型連線失敗拖慢整個函式或產生重試。
function normalizeOgText(value: string | null | undefined, fallback: string): string {
    const text = value?.trim() || '';
    return /^[\x20-\x7E]*$/u.test(text) && text.length > 0 ? text : fallback;
}



export async function GET(request: Request) {
    const limited = rateLimit(request, { name: 'og-image', limit: 30, windowMs: 60_000 });
    if (limited) return limited;

    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>&source=<source>
        const title = normalizeOgText(searchParams.get('title')?.slice(0, 100), OG_TITLE_FALLBACK);
        const source = normalizeOgText(searchParams.get('source')?.slice(0, 80), OG_SOURCE_FALLBACK);

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
                        color: 'white',
                        fontFamily: 'sans-serif',
                        padding: '40px 80px',
                    }}
                >
                    {/* Background Grid Pattern - Simulated with simple dots/lines if possible, or just gradient */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(to right, #2563eb, #9333ea, #10b981)',
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                        fontSize: '24px',
                        color: '#94a3b8',
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                        {source}
                    </div>

                    <div style={{
                        fontSize: '60px',
                        fontWeight: 900,
                        lineHeight: 1.2,
                        marginBottom: '40px',
                        background: 'linear-gradient(to right, #fff, #cbd5e1)',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}>
                        {title}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        color: '#64748b',
                        fontSize: '20px',
                    }}>
                        <div>AI Trends Daily</div>
                        <div>smart-flow.rd.coach</div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                headers: publicCacheHeaders(86400, 604800),
            },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
