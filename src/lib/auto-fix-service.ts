/**
 * 自動修復服務
 * 雙向檢查並修復：
 * 1. 中文版：確保所有新聞都有中文標題和摘要
 * 2. 英文版：確保所有新聞都有英文標題和摘要
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

// 英→中翻譯
async function translateToChineseWithSummary(title: string, url: string): Promise<{ title_zh: string; summary_zh: string }> {
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

// 中→英翻譯
async function translateToEnglish(title: string, summaryZh: string | null): Promise<{ title_en: string; summary_en: string }> {
    const prompt = `Translate the following Traditional Chinese news to English:

Title: ${title}
Summary: ${summaryZh?.substring(0, 500) || 'N/A'}

Output JSON format:
{
  "title_en": "Professional English title",
  "summary_en": "2-3 sentence English summary, plain text"
}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
}

/**
 * 自動修復缺少中文內容的新聞（英→中）
 */
export async function autoFixChineseContent(daysBack = 7, limit = 20): Promise<number> {
    console.log(`[AutoFix-ZH] Checking Chinese content from last ${daysBack} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, original_url')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('[AutoFix-ZH] Error fetching news:', error);
        return 0;
    }

    // 找出需要修復的項目（英文標題或缺少摘要）
    const needsFix = items?.filter(item => {
        const hasEnglishTitle = isEnglishTitle(item.title || '');
        const missingSummary = !item.summary_zh || item.summary_zh.length < 30;
        return hasEnglishTitle || missingSummary;
    }).slice(0, limit) || [];

    if (needsFix.length === 0) {
        console.log('[AutoFix-ZH] All Chinese content is complete.');
        return 0;
    }

    console.log(`[AutoFix-ZH] Found ${needsFix.length} items to fix`);
    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            const result = await translateToChineseWithSummary(item.title, item.original_url || '');
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

                if (!updateError) {
                    fixedCount++;
                    console.log(`[AutoFix-ZH] Fixed: ${item.title?.substring(0, 40)}...`);
                }
            }

            await new Promise(r => setTimeout(r, 300));
        } catch (e: unknown) {
            console.error(`[AutoFix-ZH] Error:`, (e as Error).message);
        }
    }

    console.log(`[AutoFix-ZH] Completed. Fixed ${fixedCount} items.`);
    return fixedCount;
}

/**
 * 自動修復缺少英文內容的新聞（中→英）
 */
export async function autoFixEnglishContent(daysBack = 7, limit = 20): Promise<number> {
    console.log(`[AutoFix-EN] Checking English content from last ${daysBack} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en')
        .gte('published_at', cutoffDate.toISOString())
        .is('title_en', null)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[AutoFix-EN] Error fetching news:', error);
        return 0;
    }

    if (!items || items.length === 0) {
        console.log('[AutoFix-EN] All English content is complete.');
        return 0;
    }

    console.log(`[AutoFix-EN] Found ${items.length} items to fix`);
    let fixedCount = 0;

    for (const item of items) {
        try {
            const result = await translateToEnglish(item.title, item.summary_zh);

            if (result.title_en) {
                const { error: updateError } = await supabase
                    .from('news_items')
                    .update({
                        title_en: result.title_en,
                        summary_en: result.summary_en || null
                    })
                    .eq('id', item.id);

                if (!updateError) {
                    fixedCount++;
                    console.log(`[AutoFix-EN] Fixed: ${result.title_en.substring(0, 40)}...`);
                }
            }

            await new Promise(r => setTimeout(r, 300));
        } catch (e: unknown) {
            console.error(`[AutoFix-EN] Error:`, (e as Error).message);
        }
    }

    console.log(`[AutoFix-EN] Completed. Fixed ${fixedCount} items.`);
    return fixedCount;
}

/**
 * 雙向自動修復（中文+英文）
 * 每日 Cron 呼叫此函數
 */
export async function autoFixNewsContent(daysBack = 7, limit = 20): Promise<{ chinese: number; english: number }> {
    console.log(`[AutoFix] Starting bilingual content check...`);

    // 1. 修復中文內容（英→中）
    const chineseFixed = await autoFixChineseContent(daysBack, limit);

    // 2. 修復英文內容（中→英）
    const englishFixed = await autoFixEnglishContent(daysBack, limit);

    console.log(`[AutoFix] Total fixed: ${chineseFixed} Chinese, ${englishFixed} English`);

    return { chinese: chineseFixed, english: englishFixed };
}
