import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';
import * as cheerio from 'cheerio';

// Phase 2: 為待處理項目生成摘要
export const maxDuration = 60;

const MAX_PROCESS_PER_RUN = 3; // 每次處理 3 則，確保在 60 秒內完成

// 抓取網頁文章內容（簡化版）
async function fetchArticleContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartFlowBot/1.0)',
            },
            signal: AbortSignal.timeout(10000), // 10 秒超時
        });

        if (!response.ok) return '';

        const html = await response.text();
        const $ = cheerio.load(html);

        // 移除不需要的元素
        $('script, style, nav, header, footer, aside, iframe, noscript').remove();
        $('[class*="comment"], [class*="sidebar"], [class*="ad-"], [id*="comment"], [id*="sidebar"]').remove();

        // 嘗試找文章主體
        let content = '';
        const selectors = ['article', '[role="main"]', '.post-content', '.article-body', '.entry-content', 'main', '.content'];

        for (const selector of selectors) {
            const el = $(selector);
            if (el.length > 0) {
                content = el.text();
                break;
            }
        }

        // Fallback: 取 body 文字
        if (!content) {
            content = $('body').text();
        }

        // 清理和截斷
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim()
            .substring(0, 4000); // 限制長度避免 token 過多

        return content || '';
    } catch (error) {
        console.log(`Failed to fetch content from ${url}:`, error);
        return '';
    }
}

export async function GET(req: NextRequest) {
    // 驗證 Cron Secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV !== 'development') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('--- Phase 2: Summarize Pending Items ---');

        // 1. 讀取待處理項目 (summary_zh IS NULL)
        const { data: pendingItems, error: fetchError } = await supabase
            .from('news_items')
            .select('id, title, original_url')
            .is('summary_zh', null)
            .order('created_at', { ascending: false })
            .limit(MAX_PROCESS_PER_RUN);

        if (fetchError) {
            throw new Error(`Failed to fetch pending items: ${fetchError.message}`);
        }

        if (!pendingItems || pendingItems.length === 0) {
            console.log('No pending items to summarize.');
            return NextResponse.json({ success: true, processed: 0, message: 'No pending items.' });
        }

        console.log(`Found ${pendingItems.length} pending items.`);

        // 2. 逐一生成摘要並更新 DB
        let processedCount = 0;

        for (const item of pendingItems) {
            try {
                console.log(`Processing: ${item.title.substring(0, 50)}...`);

                // 抓取網頁內容
                const articleContent = await fetchArticleContent(item.original_url);
                const contentForLLM = articleContent || item.title; // Fallback to title if content fetch fails
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

                        // 非同步發佈到社群媒體
                        let takeaway = '';
                        const match = summary.summary_zh.match(/💡\s*關鍵影響[：:]\s*(.*)/);
                        if (match && match[1]) {
                            takeaway = match[1].trim();
                        }

                        const { postToSocialMedia } = await import('@/lib/social');
                        postToSocialMedia({
                            title: summary.title_zh || item.title,
                            takeaway,
                            url: item.original_url,
                            tags: summary.tags
                        }).catch(e => console.error('Social post failed:', e));
                    }
                }
            } catch (e) {
                console.error(`Error summarizing ${item.title}:`, e);
            }
        }

        console.log(`Phase 2 complete. Processed ${processedCount} items.`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            pending: pendingItems.length
        });

    } catch (error: any) {
        console.error('Phase 2 summarize failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
