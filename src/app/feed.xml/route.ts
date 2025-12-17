import { supabase } from '@/lib/supabase';
import RSS from 'rss';

// export const revalidate = 3600; // Cache for 1 hour
export const dynamic = 'force-dynamic';

export async function GET() {
    const feed = new RSS({
        title: 'AI Trends Daily',
        description: '每日精選全球人工智慧新聞摘要',
        site_url: process.env.NEXT_PUBLIC_APP_URL || 'https://smart-flow.rd.coach',
        feed_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://smart-flow.rd.coach'}/feed.xml`,
        language: 'zh-TW',
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}, AI Trends Daily`,
    });

    const { data: items } = await supabase
        .from('news_items')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

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
        },
    });
}
