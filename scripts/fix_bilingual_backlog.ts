import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// --- Inline Service Logic to avoid import issues ---

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isEnglishText(text: string): boolean {
    if (!text || text.length < 5) return false;
    const englishChars = text.match(/[a-zA-Z]/g)?.length || 0;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
    // Core improvement: If there are 3 or more Chinese characters, consider it Chinese
    if (chineseChars >= 3) {
        return false; // This is a Chinese title
    }
    // If there are only 0-2 Chinese characters, use the English ratio to decide
    return englishChars / text.length > 0.4;
}

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

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
}

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

    return JSON.parse(response.choices[0]?.message?.content || '{}');
}

async function autoFixChineseContent(daysBack = 14, limit = 200) {
    console.log(`[AutoFix-ZH] Checking Chinese content from last ${daysBack} days...`);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, original_url')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    const needsFix = items?.filter(item => {
        const titleIsEnglish = isEnglishText(item.title || '');
        const summaryMissing = !item.summary_zh || item.summary_zh.length < 30;
        const summaryIsEnglish = item.summary_zh && isEnglishText(item.summary_zh);
        return titleIsEnglish || summaryMissing || summaryIsEnglish;
    }).slice(0, limit) || [];

    console.log(`[AutoFix-ZH] Found ${needsFix.length} items to fix`);
    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            console.log(`[AutoFix-ZH] Processing: ${item.title?.substring(0, 30)}...`);
            const result = await translateToChineseWithSummary(item.title, item.original_url || '', item.summary_zh);
            const updateData: Record<string, string> = {};

            if (isEnglishText(item.title || '')) updateData.title = result.title_zh;
            if (result.summary_zh && result.summary_zh.length > 20) updateData.summary_zh = result.summary_zh;

            if (Object.keys(updateData).length > 0) {
                await supabase.from('news_items').update(updateData).eq('id', item.id);
                fixedCount++;
                console.log(`  ✓ Fixed`);
            }
            await new Promise(r => setTimeout(r, 600)); // Relaxed rate limit for batch
        } catch (e) {
            console.error(`  ✗ Error: ${(e as Error).message}`);
        }
    }
    return fixedCount;
}

async function autoFixEnglishContent(daysBack = 14, limit = 200) {
    console.log(`[AutoFix-EN] Checking English content from last ${daysBack} days...`);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: items } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    const needsFix = items?.filter(item => {
        const titleMissing = !item.title_en;
        const titleNotEnglish = item.title_en && !isEnglishText(item.title_en);
        const summaryMissing = !item.summary_en;
        const summaryNotEnglish = item.summary_en && !isEnglishText(item.summary_en);
        return titleMissing || titleNotEnglish || summaryMissing || summaryNotEnglish;
    }).slice(0, limit) || [];

    console.log(`[AutoFix-EN] Found ${needsFix.length} items to fix`);
    let fixedCount = 0;

    for (const item of needsFix) {
        try {
            console.log(`[AutoFix-EN] Processing: ${item.title?.substring(0, 30)}...`);
            const sourceTitle = item.summary_zh ? item.title : (item.title_en || item.title);
            const sourceSummary = item.summary_zh || item.summary_en || '';
            const result = await translateToEnglish(sourceTitle, sourceSummary);

            if (result.title_en) {
                const updateData: Record<string, string> = {};
                if (!item.title_en || !isEnglishText(item.title_en)) updateData.title_en = result.title_en;
                if (!item.summary_en || !isEnglishText(item.summary_en)) updateData.summary_en = result.summary_en;

                if (Object.keys(updateData).length > 0) {
                    await supabase.from('news_items').update(updateData).eq('id', item.id);
                    fixedCount++;
                    console.log(`  ✓ Fixed`);
                }
            }
            await new Promise(r => setTimeout(r, 600));
        } catch (e) {
            console.error(`  ✗ Error: ${(e as Error).message}`);
        }
    }
    return fixedCount;
}

async function run() {
    console.log('🚀 Starting Batch Bilingual Fix (Last 14 Days)...');
    const zhFixed = await autoFixChineseContent(14, 200);
    const enFixed = await autoFixEnglishContent(14, 200);
    console.log(`\n✅ Completed! Fixed: ${zhFixed} Chinese, ${enFixed} English`);
}

run();
