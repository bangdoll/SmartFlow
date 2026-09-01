import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/llm';
import { hasMaintenanceAuth } from '@/lib/api-auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import * as cheerio from 'cheerio';

// Phase 2: 為待處理項目生成摘要
// 優化版：適用於外部 cron 服務的 30 秒限制
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 每次只處理 1 則，確保在 30 秒內完成（外部 cron 服務限制）
const MAX_PROCESS_PER_RUN = 1;
const FETCH_TIMEOUT_MS = 5000; // 5 秒超時（原本 10 秒）
const LLM_TIMEOUT_MS = 35_000; // 留出資料庫更新與回應時間，不能撞上 Vercel 60 秒上限

// 抓取網頁文章內容（優化版）
async function fetchArticleContent(url: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartFlowBot/1.0)',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

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

        // 清理和截斷（減少到 2000 字符以加快 LLM 處理）
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim()
            .substring(0, 2000);

        return content || '';
    } catch (error) {
        // 超時或其他錯誤時直接返回空字串，不阻塞流程
        console.log(`Failed to fetch content from ${url}:`, (error as Error).message);
        return '';
    }
}

export async function GET(req: NextRequest) {
    const startTime = Date.now();

    // 驗證 Cron Secret
    if (!hasMaintenanceAuth(req)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('--- Phase 2: Summarize Pending Items (Optimized) ---');

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
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'No pending items.',
                durationMs: Date.now() - startTime
            });
        }

        console.log(`Found ${pendingItems.length} pending item(s).`);

        // 2. 處理單一項目
        const item = pendingItems[0];
        let processedCount = 0;

        try {
            console.log(`Processing: ${item.title.substring(0, 50)}...`);

            // 抓取網頁內容（帶超時保護）
            const articleContent = await fetchArticleContent(item.original_url);
            const contentForLLM = articleContent || item.title;
            console.log(`Content length: ${contentForLLM.length} chars, elapsed: ${Date.now() - startTime}ms`);

            // 生成摘要：單次排程不重試，並在平台逾時前主動中止。
            const summaryController = new AbortController();
            const summaryTimeoutId = setTimeout(() => summaryController.abort(), LLM_TIMEOUT_MS);
            let summary;
            try {
                summary = await generateSummary(item.title, contentForLLM, {
                    abortSignal: summaryController.signal,
                    maxRetries: 0,
                });
            } finally {
                clearTimeout(summaryTimeoutId);
            }
            console.log(`Summary generated, elapsed: ${Date.now() - startTime}ms`);

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

                    // 非同步發佈到社群媒體（完全非阻塞，不等待結果）
                    let takeaway = '';
                    const match = summary.summary_zh.match(/💡\s*關鍵影響[：:]\s*(.*)/);
                    if (match && match[1]) {
                        takeaway = match[1].trim();
                    }

                    // 使用 Promise 但不 await，確保不阻塞回應
                    import('@/lib/social').then(({ postToSocialMedia }) => {
                        postToSocialMedia({
                            title: summary.title_zh || item.title,
                            takeaway,
                            url: item.original_url,
                            tags: summary.tags
                        }).catch(e => console.error('Social post failed:', e));
                    }).catch(e => console.error('Social import failed:', e));
                }
            }
        } catch (e) {
            console.error(`Error summarizing ${item.title}:`, e);
        }

        const totalDuration = Date.now() - startTime;
        console.log(`Phase 2 complete. Processed ${processedCount} item(s) in ${totalDuration}ms.`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            pending: pendingItems.length,
            durationMs: totalDuration
        });

    } catch (error: unknown) {
        console.error('Phase 2 summarize failed:', error);
        return NextResponse.json({
            error: (error as Error).message || 'Internal Server Error',
            durationMs: Date.now() - startTime
        }, { status: 500 });
    }
}
