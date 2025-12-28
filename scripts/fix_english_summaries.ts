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

// 檢測 summary_zh 是否實際上是英文內容
function isEnglishSummary(summary: string): boolean {
    if (!summary || summary.length < 20) return false;

    // 移除 emoji 和符號後檢查
    const cleanText = summary.replace(/[🗣⚠️✅💡📊🔑👔\s\n:：*]+/g, '');

    // 計算英文字母比例
    const englishChars = cleanText.match(/[a-zA-Z]/g)?.length || 0;
    const chineseChars = cleanText.match(/[\u4e00-\u9fff]/g)?.length || 0;

    // 如果英文字元數量遠超過中文，則判定為英文摘要
    return englishChars > chineseChars * 2 && englishChars > 30;
}

async function generateChineseSummary(title: string, englishSummary: string): Promise<string> {
    const prompt = `請將以下英文新聞摘要翻譯成繁體中文，並使用以下格式：

標題：${title}
英文摘要：${englishSummary}

請輸出繁體中文摘要，格式如下：
🗣 白話文解讀
[用簡單的話解釋這則新聞]

⚠️ 這對你的影響
[說明對一般人的影響]

✅ 你不需要做什麼
[給予實用建議]`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
}

async function fixEnglishSummaries() {
    console.log('🔍 尋找 summary_zh 欄位中的英文內容...\n');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh')
        .gte('published_at', cutoffDate.toISOString())
        .not('summary_zh', 'is', null)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const englishSummaries = items?.filter(item => isEnglishSummary(item.summary_zh || '')) || [];

    if (englishSummaries.length === 0) {
        console.log('✅ 所有 summary_zh 都是中文內容！');
        return;
    }

    console.log(`📋 找到 ${englishSummaries.length} 則 summary_zh 是英文的新聞\n`);

    let fixed = 0;
    for (const item of englishSummaries) {
        console.log(`修復中: ${item.title?.substring(0, 50)}...`);

        try {
            const chineseSummary = await generateChineseSummary(item.title, item.summary_zh);

            if (chineseSummary && chineseSummary.length > 30) {
                const { error: updateError } = await supabase
                    .from('news_items')
                    .update({ summary_zh: chineseSummary })
                    .eq('id', item.id);

                if (!updateError) {
                    fixed++;
                    console.log(`  ✓ 已修復`);
                } else {
                    console.log(`  ✗ 更新失敗:`, updateError.message);
                }
            }

            await new Promise(r => setTimeout(r, 300));
        } catch (e: unknown) {
            console.error(`  ✗ 錯誤:`, (e as Error).message);
        }
    }

    console.log(`\n✅ 完成！修復 ${fixed}/${englishSummaries.length} 則摘要`);
}

fixEnglishSummaries();
