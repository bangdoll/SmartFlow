import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAllPreviews, type NewsContext } from '@/lib/social-templates';
import { publicCacheHeaders } from '@/lib/cache-control';
import { SITE_URL } from '@/lib/site';
import { z } from 'zod';

const SocialPreviewQuerySchema = z.object({
    newsId: z.string().uuid(),
});

export const dynamic = 'force-dynamic';

/**
 * 社群貼文預覽 API
 * GET /api/social-preview?newsId=xxx
 * 
 * 返回該新聞的所有平台貼文預覽
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get('newsId');

    const parsed = SocialPreviewQuerySchema.safeParse({ newsId });
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid newsId' }, { status: 400 });
    }

    try {
        // 獲取新聞資料
        const { data: newsItem, error } = await supabase
            .from('news_items')
            .select('id, title, summary_zh, original_url, tags')
            .eq('id', parsed.data.newsId)
            .single();

        if (error || !newsItem) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        // 從摘要中提取 takeaway
        let takeaway = '';
        if (newsItem.summary_zh) {
            const takeawayMatch = newsItem.summary_zh.match(/💡[^⚠️✅📊🧠]+/);
            if (takeawayMatch) {
                takeaway = takeawayMatch[0].trim();
            }
        }

        // 建構 NewsContext
        const newsContext: NewsContext = {
            title: newsItem.title,
            summary: newsItem.summary_zh,
            takeaway,
            url: `${SITE_URL}/news/${newsItem.id.substring(0, 8)}`,
            tags: newsItem.tags || [],
        };

        // 生成所有平台的貼文預覽
        const previews = generateAllPreviews(newsContext);

        return NextResponse.json(
            {
                newsId: newsItem.id,
                title: newsItem.title,
                previews,
            },
            { headers: publicCacheHeaders(300, 1800) }
        );

    } catch (error: unknown) {
        console.error('Social preview error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
