import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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

async function fixWeeklyContent() {
    // 獲取過去 7 天的新聞
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, original_url')
        .gte('published_at', sevenDaysAgo.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching news:', error);
        return;
    }

    // 找出需要修復的項目（英文標題或缺少摘要）
    const needsFix = items?.filter(item => {
        const hasEnglishTitle = isEnglishTitle(item.title || '');
        const missingSummary = !item.summary_zh || item.summary_zh.length < 20;
        return hasEnglishTitle || missingSummary;
    }) || [];

    console.log(`\n找到 ${needsFix.length} 則需要修復的新聞\n`);

    for (const item of needsFix) {
        console.log(`修復中: ${item.title?.substring(0, 50)}...`);

        try {
            const result = await translateAndSummarize(item.title, item.original_url || '');

            const updateData: Record<string, string> = {};

            if (isEnglishTitle(item.title)) {
                updateData.title = result.title_zh;
            }

            if (!item.summary_zh || item.summary_zh.length < 20) {
                updateData.summary_zh = result.summary_zh;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('news_items')
                    .update(updateData)
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`  ✗ 更新失敗:`, updateError.message);
                } else {
                    console.log(`  ✓ 已修復`);
                }
            }
        } catch (e: any) {
            console.error(`  ✗ 錯誤:`, e.message);
        }

        // 避免 API 限流
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n完成！');
}

fixWeeklyContent();
