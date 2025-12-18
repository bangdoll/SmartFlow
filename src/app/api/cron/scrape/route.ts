import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

// Phase 1: 純爬取，不生成摘要 (避免逾時)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // 驗證 Cron Secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV !== 'development') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('--- Phase 1: Scrape Only ---');

        // 1. 爬取新聞
        const scrapedItems = await scrapeAllSources();
        console.log(`Scraped ${scrapedItems.length} items.`);

        if (scrapedItems.length === 0) {
            return NextResponse.json({ success: true, message: 'No news found.', inserted: 0 });
        }

        // 2. 過濾已存在的新聞並寫入 DB (不填 summary)
        let insertedCount = 0;

        for (const item of scrapedItems) {
            const { data: existing } = await supabase
                .from('news_items')
                .select('id')
                .eq('original_url', item.original_url)
                .single();

            if (!existing) {
                const { error } = await supabase
                    .from('news_items')
                    .insert({
                        original_url: item.original_url,
                        title: item.title,
                        source: item.source,
                        published_at: item.published_at,
                        slug: nanoid(8),
                        // summary_zh 和 summary_en 留空，等 Phase 2 處理
                    });

                if (!error) {
                    insertedCount++;
                } else {
                    console.error(`Failed to insert ${item.title}:`, error.message);
                }
            }
        }

        console.log(`Phase 1 complete. Inserted ${insertedCount} new items (pending summary).`);

        return NextResponse.json({
            success: true,
            scraped: scrapedItems.length,
            inserted: insertedCount
        });

    } catch (error: any) {
        console.error('Phase 1 scrape failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
