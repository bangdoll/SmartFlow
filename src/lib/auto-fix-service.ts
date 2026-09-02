/**
 * 自動修復服務
 * 雙向檢查並修復：
 * 1. 中文版：確保所有新聞都有中文標題和摘要
 * 2. 英文版：確保所有新聞都有英文標題和摘要
 */

import OpenAI from 'openai';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { isEnglishText } from '@/lib/text-language';

function getOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    return new OpenAI({ apiKey });
}

// 英→中翻譯
async function translateToChineseWithSummary(title: string, url: string, existingSummary: string | null = null): Promise<{ title_zh: string; summary_zh: string }> {
    const prompt = `請為以下英文新聞進行繁體中文本地化：

標題：${title}
${existingSummary ? `現有摘要 (可能是英文)：${existingSummary}` : `網址：${url}`}

任務：
1. 翻譯標題成繁體中文 (台灣用語)
2. 生成/翻譯繁體中文摘要 (必須全中文)

請使用以下 JSON 格式回覆：
{
  "title_zh": "繁體中文標題",
  "summary_zh": "🗣 白話文解讀\\n[解釋]\\n\\n⚠️ 這對你的影響\\n[影響]\\n\\n✅ 你不需要做什麼\\n[建議]"
}`;

    const response = await getOpenAI().chat.completions.create({
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
  "summary_en": "MUST follow this strict 3-part structure with emojis:\\n🗣 **Plain English Breakdown**\\n[Explain simply]\\n\\n⚠️ **Impact on You**\\n[Why it matters]\\n\\n✅ **Actionable Advice**\\n[What to do]"
}`;

    const response = await getOpenAI().chat.completions.create({
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
 * 自動修復中文內容 (英→中)
 * 檢查:
 * 1. Title 是英文
 * 2. Summary 缺失
 * 3. Summary 是英文
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

    // 找出需要修復的項目
    const needsFix = items?.filter(item => {
        const titleIsEnglish = isEnglishText(item.title || '');
        const summaryMissing = !item.summary_zh || item.summary_zh.length < 30;
        const summaryIsEnglish = item.summary_zh && isEnglishText(item.summary_zh);

        return titleIsEnglish || summaryMissing || summaryIsEnglish;
    }).slice(0, limit) || [];

    if (needsFix.length === 0) {
        console.log('[AutoFix-ZH] All Chinese content is complete.');
        return 0;
    }

    console.log(`[AutoFix-ZH] Found ${needsFix.length} items to fix`);
    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            const result = await translateToChineseWithSummary(
                item.title,
                item.original_url || '',
                item.summary_zh
            );

            const updateData: Record<string, string> = {};

            // 只有當標題被檢測為英文時才更新，避免過度翻譯
            if (isEnglishText(item.title || '') && result.title_zh && !isEnglishText(result.title_zh)) {
                updateData.title = result.title_zh;
            }

            // 總是更新摘要（因為如果進入這裡，摘要不是缺失就是英文）
            if (
                result.summary_zh &&
                result.summary_zh.length > 20 &&
                !isEnglishText(result.summary_zh)
            ) {
                updateData.summary_zh = result.summary_zh;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('news_items')
                    .update(updateData)
                    .eq('id', item.id);

                if (!updateError) {
                    fixedCount++;
                    const action = updateData.title ? 'Title+Summary' : 'Summary';
                    console.log(`[AutoFix-ZH] Fixed (${action}): ${item.title?.substring(0, 30)}...`);
                }
            }

            await new Promise(r => setTimeout(r, 500)); // Rate limit protection
        } catch (e: unknown) {
            console.error(`[AutoFix-ZH] Error:`, (e as Error).message);
        }
    }

    console.log(`[AutoFix-ZH] Completed. Fixed ${fixedCount} items.`);
    return fixedCount;
}

/**
 * 自動修復英文內容 (中→英)
 * 檢查:
 * 1. Title_EN 缺失
 * 2. Title_EN 是中文 (非英文)
 * 3. Summary_EN 缺失
 * 4. Summary_EN 是中文 (非英文)
 */
export async function autoFixEnglishContent(daysBack = 7, limit = 20): Promise<number> {
    console.log(`[AutoFix-EN] Checking English content from last ${daysBack} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('[AutoFix-EN] Error fetching news:', error);
        return 0;
    }

    // 找出需要修復的項目
    const needsFix = items?.filter(item => {
        const titleMissing = !item.title_en;
        const titleNotEnglish = item.title_en && !isEnglishText(item.title_en);

        const summaryMissing = !item.summary_en;
        const summaryNotEnglish = item.summary_en && !isEnglishText(item.summary_en);

        return titleMissing || titleNotEnglish || summaryMissing || summaryNotEnglish;
    }).slice(0, limit) || [];

    if (needsFix.length === 0) {
        console.log('[AutoFix-EN] All English content is complete.');
        return 0;
    }

    console.log(`[AutoFix-EN] Found ${needsFix.length} items to fix`);
    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            // 如果需要修復英文，我們依賴中文內容作為來源
            const sourceTitle = item.summary_zh ? item.title : (item.title_en || item.title); // Prefer title if valid
            const sourceSummary = item.summary_zh || item.summary_en || '';

            const result = await translateToEnglish(sourceTitle, sourceSummary);

            if (result.title_en) {
                const updateData: Record<string, string> = {};

                // 如果標題缺失或甚至不是英文，則更新
                if (!item.title_en || !isEnglishText(item.title_en)) {
                    updateData.title_en = result.title_en;
                }

                // 如果摘要缺失或甚至不是英文，則更新
                if (!item.summary_en || !isEnglishText(item.summary_en)) {
                    updateData.summary_en = result.summary_en;
                }

                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabase
                        .from('news_items')
                        .update(updateData)
                        .eq('id', item.id);

                    if (!updateError) {
                        fixedCount++;
                        console.log(`[AutoFix-EN] Fixed: ${result.title_en.substring(0, 30)}...`);
                    }
                }
            }

            await new Promise(r => setTimeout(r, 500));
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
