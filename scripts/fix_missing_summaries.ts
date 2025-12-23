import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const missingSummaryIds = [
    'b025c40c-00eb-4785-bb84-ac6b54d39630', // AI基本法 - 數位時代
    '8b615b97-5127-476b-baf0-4555bb890617', // AI基本法 - 聯合新聞網
];

async function generateSummary(title: string, url: string): Promise<string> {
    const prompt = `請為以下新聞生成繁體中文摘要，使用結構化格式：

標題：${title}
網址：${url}

請使用以下格式：
🗣 白話文解讀
[用一般人聽得懂的話解釋這則新聞在講什麼]

⚠️ 這對你的影響
[說明這則新聞對一般人或企業的實際影響]

✅ 你不需要做什麼
[告訴讀者他們不需要擔心或不需要採取行動的部分，減少資訊焦慮]`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '';
}

async function fixMissingSummaries() {
    for (const id of missingSummaryIds) {
        const { data: item, error } = await supabase
            .from('news_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !item) {
            console.error(`Failed to fetch item ${id}:`, error);
            continue;
        }

        console.log(`\nGenerating summary for: ${item.title?.substring(0, 50)}...`);

        try {
            const summary = await generateSummary(item.title, item.url);

            const { error: updateError } = await supabase
                .from('news_items')
                .update({ summary_zh: summary })
                .eq('id', id);

            if (updateError) {
                console.error(`Failed to update ${id}:`, updateError);
            } else {
                console.log(`✓ Updated successfully`);
                console.log(`Summary preview: ${summary.substring(0, 100)}...`);
            }
        } catch (e) {
            console.error(`Error generating summary for ${id}:`, e);
        }
    }
}

fixMissingSummaries();
