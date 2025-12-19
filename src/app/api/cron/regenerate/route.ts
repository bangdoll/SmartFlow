import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';
import * as cheerio from 'cheerio';

// 一次性端點：重新生成現有新聞的摘要（用完即刪）
export const maxDuration = 60;

const MAX_PROCESS_PER_RUN = 2; // 每次處理 2 則

// 抓取網頁文章內容
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
        console.log('--- Regenerate Summaries for Existing News ---');

        // 優先處理缺少 summary_zh 的新聞
        const { data: missingSummaryZh, error: fetchError1 } = await supabase
            .from('news_items')
            .select('id, title, original_url, summary_en, summary_zh')
            .is('summary_zh', null)
            .order('created_at', { ascending: false })
            .limit(MAX_PROCESS_PER_RUN);

        if (fetchError1) {
            throw new Error(`Failed to fetch items: ${fetchError1.message}`);
        }

        let itemsToProcess = missingSummaryZh || [];

        // 如果沒有缺少中文摘要的，再找舊格式英文摘要的
        if (itemsToProcess.length === 0) {
            const { data: items, error: fetchError2 } = await supabase
                .from('news_items')
                .select('id, title, original_url, summary_en, summary_zh')
                .not('summary_en', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (fetchError2) {
                throw new Error(`Failed to fetch items: ${fetchError2.message}`);
            }

            itemsToProcess = items?.filter(item =>
                item.summary_en && !item.summary_en.includes('Plain English')
            ).slice(0, MAX_PROCESS_PER_RUN) || [];
        }

        if (itemsToProcess.length === 0) {
            console.log('No items to regenerate.');
            return NextResponse.json({ success: true, processed: 0, message: 'All items already have proper format.' });
        }

        console.log(`Found ${itemsToProcess.length} items to regenerate.`);

        let processedCount = 0;

        for (const item of itemsToProcess) {
            try {
                console.log(`Regenerating: ${item.title.substring(0, 50)}...`);

                const articleContent = await fetchArticleContent(item.original_url);
                const contentForLLM = articleContent || item.title;
                console.log(`Fetched content length: ${contentForLLM.length} chars`);

                const summary = await generateSummary(item.title, contentForLLM);

                if (summary) {
                    const { error: updateError } = await supabase
                        .from('news_items')
                        .update({
                            title: summary.title_zh || item.title,
                            summary_zh: summary.summary_zh,
                            summary_en: summary.summary_en,
                            tags: summary.tags,
                        })
                        .eq('id', item.id);

                    if (updateError) {
                        console.error(`Failed to update ${item.id}:`, updateError.message);
                    } else {
                        processedCount++;
                        console.log(`✅ Regenerated: ${item.title.substring(0, 40)}...`);
                    }
                }
            } catch (e) {
                console.error(`Error regenerating ${item.title}:`, e);
            }
        }

        console.log(`Regeneration complete. Processed ${processedCount} items.`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            found: itemsToProcess.length
        });

    } catch (error: any) {
        console.error('Regenerate failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
