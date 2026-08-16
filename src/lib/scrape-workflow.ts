import { scrapeAllSources } from '@/lib/scraper';
import { generateSummary } from '@/lib/llm';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

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
                        slug: nanoid(8),
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`Failed to insert item ${item.title}:`, error);
                } else {
                    results.push(data);
                    processedCount++;

                    // 4. 自動發佈到社群媒體
                    // 嘗試從中文摘要中提取 "關鍵影響"
                    let takeaway = '';
                    const match = summary.summary_zh.match(/💡\s*關鍵影響[：:]\s*(.*)/);
                    if (match && match[1]) {
                        takeaway = match[1].trim();
                    }

                    // 非同步執行，不阻塞主流程
                    const { postToSocialMedia } = await import('@/lib/social');
                    postToSocialMedia({
                        title: data.title,
                        takeaway: takeaway, // 如果沒抓到就是空字串
                        url: data.original_url, // 或者指向我們網站的連結？通常指向原始新聞比較尊重來源，或指向我們網站增加流量? 
                        // 使用者原本說 "連結"，通常指原始連結，但為了 Growth，應該指向我們網站？
                        // 但目前網站沒有單一新聞頁面 (只有列表)，所以指向我們首頁 + hash? 或者直接原始連結?
                        // 根據 User request: "文案範例... (連結)"
                        // 為了導流，最好是指向我們網站。但我們網站目前沒有 news/:id 頁面。
                        // 暫時先用原始連結，這是最安全的做法。
                        // 或者： https://smart-flow.rd.coach/?tag=AI (如果 tag 存在)

                        // User request said: "這是擴大流量最快的方法" -> implies linking to OUR site.
                        // But we don't have detail page.
                        // Let's stick to original_url for now as it provides immediate value, 
                        // OR if we want traffic, maybe "Read more: https://smart-flow.rd.coach"
                        // I will use original_url for credibility first.
                        tags: summary.tags
                    }).catch(e => console.error('Social post failed:', e));
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
