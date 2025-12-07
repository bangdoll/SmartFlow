import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';

// 設定最大執行時間 (Vercel Pro 為 300s, Hobby 為 10s/60s)
// 注意：Hobby Plan 的 Serverless Function 限制較嚴格，
// 如果處理大量新聞可能需要分批或使用 Edge Function (但 Edge 不支援所有 Node API)
// 這裡暫時使用預設設定，建議在 Vercel 設定 maxDuration
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // 驗證 Cron Secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // 為了方便手動測試，如果沒有設定 CRON_SECRET 且是開發環境，允許通過
        if (process.env.NODE_ENV !== 'development') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('Starting daily scrape job...');

        // 1. 爬取新聞
        const scrapedItems = await scrapeAllSources();
        console.log(`Scraped ${scrapedItems.length} items.`);

        if (scrapedItems.length === 0) {
            return NextResponse.json({ message: 'No news found.' });
        }

        // 2. 過濾已存在的新聞
        // 取得所有 original_url 以進行比對
        // 注意：如果資料量大，應該用查詢過濾，而不是拉回全部
        // 這裡優化為：對每個 URL 檢查是否存在 (或者使用 upsert 但我們不想重複摘要)

        const newItems = [];

        for (const item of scrapedItems) {
            const { data: existing } = await supabase
                .from('news_items')
                .select('id')
                .eq('original_url', item.original_url)
                .single();

            if (!existing) {
                newItems.push(item);
            }
        }

        console.log(`Found ${newItems.length} new items to process.`);

        // 3. 生成摘要並寫入資料庫
        // 為了避免超時，這裡可以限制處理數量，或者並行處理 (需注意 Rate Limit)
        const results = [];

        for (const item of newItems) {
            // 生成摘要
            const summary = await generateSummary(item.title, item.content || item.title);

            if (summary) {
                // 寫入資料庫
                const { data, error } = await supabase
                    .from('news_items')
                    .insert({
                        original_url: item.original_url,
                        title: item.title,
                        source: item.source,
                        published_at: item.published_at,
                        summary_en: summary.summary_en,
                        summary_zh: summary.summary_zh,
                        tags: summary.tags,
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`Failed to insert item ${item.title}:`, error);
                } else {
                    results.push(data);
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            items: results
        });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
