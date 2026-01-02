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

async function translateToChineseTitle(titleEn: string): Promise<string> {
    const prompt = `你是一位繁體中文科技新聞編輯。請將以下英文標題翻譯成自然流暢的繁體中文標題。

規則：
1. 專有名詞（產品名、公司名、技術名稱）可以保留英文，但需要加上中文說明
2. 標題必須讓中文讀者容易理解
3. 如果是網站名稱，保留原名但加上說明

英文標題：${titleEn}

回覆格式（JSON）：
{
  "title_zh": "翻譯後的繁體中文標題"
}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.title_zh || '';
}

async function fixEdgeItems() {
    console.log('🔧 Fixing edge case items with improved translation...\n');

    const ids = ['dd35f276-1f9d-4ca1-a71e-78e6f1c46ae9', '5f810597-e0fe-4689-bf7d-1f7f88d9a681'];
    const { data } = await supabase.from('news_items').select('*').in('id', ids);

    for (const item of data || []) {
        console.log(`Processing: ${item.title}`);
        console.log(`  English title: ${item.title_en}`);

        // Use the English title as source for translation
        const sourceTitle = item.title_en || item.title;
        const zhTitle = await translateToChineseTitle(sourceTitle);

        if (zhTitle && zhTitle.length > 2 && zhTitle !== item.title) {
            await supabase.from('news_items')
                .update({ title: zhTitle })
                .eq('id', item.id);
            console.log(`  ✓ Updated: ${item.title} → ${zhTitle}`);
        } else {
            console.log(`  → No change needed or translation failed`);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n✅ Done!');
}

fixEdgeItems();
