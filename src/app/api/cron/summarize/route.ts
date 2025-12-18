import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/llm';
import { supabase } from '@/lib/supabase';

// Phase 2: 為待處理項目生成摘要
export const maxDuration = 60;

const MAX_PROCESS_PER_RUN = 3; // 每次處理 3 則，確保在 60 秒內完成

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
            .select('id, title, original_url, content')
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

                const summary = await generateSummary(item.title, item.content || item.title);

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
