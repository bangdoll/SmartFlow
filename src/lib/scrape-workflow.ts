import { scrapeAllSources } from '@/lib/scraper';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';

export async function runScrapeSortAndSummary() {
    console.log('Starting daily scrape job (integrated)...');

    // 1. 爬取新聞
    const scrapedItems = await scrapeAllSources();
    console.log(`Scraped ${scrapedItems.length} items.`);

    if (scrapedItems.length === 0) {
        return { message: 'No news found.' };
    }

    // 2. 過濾已存在的新聞
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

    // 打亂順序，確保不同來源的新聞都有機會被處理
    const shuffledItems = newItems.sort(() => Math.random() - 0.5);

    // 3. 生成摘要並寫入 (限制數量以免超時)
    const results = [];
    const MAX_PROCESS = 5; // 每次處理 5 則新聞
    let processedCount = 0;

    for (const item of shuffledItems) {
        if (processedCount >= MAX_PROCESS) break;

        try {
            const summary = await generateSummary(item.title, item.content || item.title);

            if (summary) {
                const { data, error } = await supabase
                    .from('news_items')
                    .insert({
                        original_url: item.original_url,
                        title: summary.title_zh || item.title, // 優先使用中文標題
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
                    processedCount++;
                }
            }
        } catch (e) {
            console.error(`Error processing item ${item.title}`, e);
        }
    }

    return {
        success: true,
        processed: results.length,
        items: results
    };
}
