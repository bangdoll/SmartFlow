import { supabase } from '@/lib/supabase';
import RSS from 'rss';
import { SITE_URL } from '@/lib/site';
import { publicCacheHeaders } from '@/lib/cache-control';

export const revalidate = 3600;
// The feed depends on runtime Supabase credentials. Keep it out of the
// build-time prerender pass so local/CI builds can run without production
// environment variables; CDN caching is configured on the response below.
export const dynamic = 'force-dynamic';

export async function GET() {
    const feed = new RSS({
        title: 'AI Trends Daily',
        description: '每日精選全球人工智慧新聞摘要',
        site_url: SITE_URL,
        feed_url: `${SITE_URL}/feed.xml`,
        language: 'zh-TW',
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}, AI Trends Daily`,
    });

    let items: Array<{
        id: string;
        title: string;
        summary_zh: string | null;
        summary_en: string | null;
        original_url: string;
        published_at: string;
        tags: string[] | null;
    }> = [];

    try {
        const { data } = await supabase
            .from('news_items')
            .select('id, title, summary_zh, summary_en, original_url, published_at, tags')
            .order('published_at', { ascending: false })
            .limit(20);

        items = data || [];
    } catch (error) {
        console.warn('RSS feed unavailable without Supabase configuration:', error);
    }

    items?.forEach((item) => {
        feed.item({
            title: item.title,
            description: item.summary_zh || item.summary_en || '',
            url: item.original_url, // 指向原始連結，或者指向我們的詳情頁
            guid: item.id,
            date: new Date(item.published_at),
            categories: item.tags || [],
            custom_elements: [
                { 'content:encoded': item.summary_zh || item.summary_en },
            ]
        });
    });

    return new Response(feed.xml({ indent: true }), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            ...publicCacheHeaders(3600, 86400),
        },
    });
}
