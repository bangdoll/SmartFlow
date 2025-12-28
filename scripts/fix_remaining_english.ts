import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isEnglishTitle(title: string): boolean {
    const englishChars = title.match(/[a-zA-Z]/g)?.length || 0;
    const totalChars = title.replace(/[\s\d\W]/g, '').length || 1;
    return englishChars / totalChars > 0.5;
}

async function translateToChineseWithSummary(title: string, url: string) {
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

    return JSON.parse(response.choices[0]?.message?.content || '{}');
}

async function fixRemainingEnglishTitles() {
    console.log('🔍 尋找仍是英文標題的新聞...\n');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14); // 過去14天

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, original_url')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const englishTitles = items?.filter(item => isEnglishTitle(item.title || '')) || [];

    if (englishTitles.length === 0) {
        console.log('✅ 所有標題都已翻譯成中文！');
        return;
    }

    console.log(`📋 找到 ${englishTitles.length} 則仍是英文標題的新聞\n`);

    let fixed = 0;
    for (const item of englishTitles) {
        console.log(`修復中: ${item.title?.substring(0, 50)}...`);

        try {
            const result = await translateToChineseWithSummary(item.title, item.original_url || '');

            if (result.title_zh) {
                const updateData: Record<string, string> = { title: result.title_zh };
                if (!item.summary_zh || item.summary_zh.length < 30) {
                    updateData.summary_zh = result.summary_zh;
                }

                const { error: updateError } = await supabase
                    .from('news_items')
                    .update(updateData)
                    .eq('id', item.id);

                if (!updateError) {
                    fixed++;
                    console.log(`  ✓ 已修復: ${result.title_zh?.substring(0, 40)}...`);
                } else {
                    console.log(`  ✗ 更新失敗:`, updateError.message);
                }
            }

            await new Promise(r => setTimeout(r, 300));
        } catch (e: unknown) {
            console.error(`  ✗ 錯誤:`, (e as Error).message);
        }
    }

    console.log(`\n✅ 完成！修復 ${fixed}/${englishTitles.length} 則新聞`);
}

fixRemainingEnglishTitles();
