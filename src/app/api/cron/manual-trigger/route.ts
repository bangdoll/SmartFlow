import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';

// 手動觸發：執行 Phase 1 (scrape) + Phase 2 (summarize 1-2 則)
export const maxDuration = 60;

// 抓取網頁文章內容（簡化版）
async function fetchArticleContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartFlowBot/1.0)',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return '';

        const html = await response.text();
        const $ = cheerio.load(html);

        $('script, style, nav, header, footer, aside, iframe, noscript').remove();
        $('[class*="comment"], [class*="sidebar"], [class*="ad-"], [id*="comment"], [id*="sidebar"]').remove();

        let content = '';
        const selectors = ['article', '[role="main"]', '.post-content', '.article-body', '.entry-content', 'main', '.content'];

        for (const selector of selectors) {
            const el = $(selector);
            if (el.length > 0) {
                content = el.text();
                break;
            }
        }

        if (!content) {
            content = $('body').text();
        }

        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim()
            .substring(0, 4000);

        return content || '';
    } catch (error) {
        console.log(`Failed to fetch content from ${url}:`, error);
        return '';
    }
}

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limiting Check
        const { data: latestNews } = await supabase
            .from('news_items')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latestNews) {
            const lastRunTime = new Date(latestNews.created_at).getTime();
            const now = Date.now();
            const diffInMinutes = (now - lastRunTime) / 1000 / 60;

            if (diffInMinutes < 5) {
                return NextResponse.json({
                    success: false,
                    message: '最近已更新，請稍後再試。'
                });
            }
        }

        console.log('--- Manual Trigger: Scrape + Quick Summarize ---');

        // 2. Phase 1: Scrape
        const scrapedItems = await scrapeAllSources();
        console.log(`Scraped ${scrapedItems.length} items.`);

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
                    });

                if (!error) insertedCount++;
            }
        }

        // 3. Phase 2: Quick Summarize (只處理 1-2 則以避免逾時)
        const { data: pendingItems } = await supabase
            .from('news_items')
            .select('id, title, original_url')
            .is('summary_zh', null)
            .order('created_at', { ascending: false })
            .limit(2);

        let summarizedCount = 0;
        if (pendingItems && pendingItems.length > 0) {
            for (const item of pendingItems) {
                try {
                    // 抓取網頁內容
                    const articleContent = await fetchArticleContent(item.original_url);
                    const contentForLLM = articleContent || item.title;
                    console.log(`Fetched content length: ${contentForLLM.length} chars`);

                    const summary = await generateSummary(item.title, contentForLLM);
                    if (summary) {
                        await supabase
                            .from('news_items')
                            .update({
                                title: summary.title_zh || item.title,
                                summary_zh: summary.summary_zh,
                                summary_en: summary.summary_en,
                                tags: summary.tags,
                            })
                            .eq('id', item.id);
                        summarizedCount++;
                    }
                } catch (e) {
                    console.error(`Summarize failed for ${item.id}:`, e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            scraped: scrapedItems.length,
            inserted: insertedCount,
            summarized: summarizedCount,
            message: `新增 ${insertedCount} 則，已摘要 ${summarizedCount} 則`
        });

    } catch (error: any) {
        console.error('Manual trigger failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

