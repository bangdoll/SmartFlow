/**
 * 自動修復服務
 * 檢查並修復缺少中文標題或摘要的新聞
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 檢查標題是否主要是英文（超過50%英文字元）
function isEnglishTitle(title: string): boolean {
    const englishChars = title.match(/[a-zA-Z]/g)?.length || 0;
    const totalChars = title.replace(/[\s\d\W]/g, '').length || 1;
    return englishChars / totalChars > 0.5;
}

// 翻譯標題和生成摘要
async function translateAndSummarize(title: string, url: string): Promise<{ title_zh: string; summary_zh: string }> {
    const prompt = `請為以下英文新聞：
1. 翻譯標題成繁體中文
2. 生成繁體中文摘要

標題：${title}
網址：${url}

請使用以下 JSON 格式回覆：
{
  "title_zh": "繁體中文標題",
  "summary_zh": "🗣 白話文解讀\\n[解釋]\\n\\n⚠️ 這對你的影響\\n[影響]\\n\\n✅ 你不需要做什麼\\n[建議]"
}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
}

/**
 * 自動修復缺少中文標題或摘要的新聞
 * @param daysBack 往回檢查幾天的新聞
 * @param limit 一次最多處理多少則
 * @returns 修復的數量
 */
export async function autoFixNewsContent(daysBack = 7, limit = 20): Promise<number> {
    console.log(`[AutoFix] Checking news from last ${daysBack} days...`);

    // 獲取過去 N 天的新聞
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, original_url')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('[AutoFix] Error fetching news:', error);
        return 0;
    }

    // 找出需要修復的項目（英文標題或缺少摘要）
    const needsFix = items?.filter(item => {
        const hasEnglishTitle = isEnglishTitle(item.title || '');
        const missingSummary = !item.summary_zh || item.summary_zh.length < 30;
        return hasEnglishTitle || missingSummary;
    }).slice(0, limit) || [];

    if (needsFix.length === 0) {
        console.log('[AutoFix] All news content is complete. No fix needed.');
        return 0;
    }

    console.log(`[AutoFix] Found ${needsFix.length} items to fix (limited to ${limit})`);

    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            const result = await translateAndSummarize(item.title, item.original_url || '');

            const updateData: Record<string, string> = {};

            if (isEnglishTitle(item.title)) {
                updateData.title = result.title_zh;
            }

            if (!item.summary_zh || item.summary_zh.length < 30) {
                updateData.summary_zh = result.summary_zh;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('news_items')
                    .update(updateData)
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`[AutoFix] Failed to update ${item.id}:`, updateError.message);
                } else {
                    fixedCount++;
                    console.log(`[AutoFix] Fixed: ${item.title?.substring(0, 40)}...`);
                }
            }

            // 避免 API 限流
            await new Promise(r => setTimeout(r, 300));

        } catch (e: unknown) {
            const error = e as Error;
            console.error(`[AutoFix] Error processing ${item.id}:`, error.message);
        }
    }

    console.log(`[AutoFix] Completed. Fixed ${fixedCount} items.`);
    return fixedCount;
}
