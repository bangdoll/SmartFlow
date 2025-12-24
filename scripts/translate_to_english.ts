/**
 * 批次翻譯中文標題為英文
 * 用於補充缺少英文版的新聞
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 批次翻譯（每次 5 則，避免 token 超過限制）
async function batchTranslateToEnglish(items: Array<{ id: string; title: string; summary_zh: string | null }>) {
    const prompt = `Translate the following news items from Traditional Chinese to English.

Input:
${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, summary: i.summary_zh?.substring(0, 500) })))}

Output JSON format:
{
  "results": [
    { "id": "...", "title_en": "...", "summary_en": "..." }
  ]
}

Requirements:
- title_en: Concise, professional English title
- summary_en: 2-3 sentence English summary, plain text`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content).results || [];
}

async function translateMissingEnglish() {
    console.log('\n=== 開始翻譯缺少英文版的新聞 ===\n');

    // 獲取過去 30 天缺少英文標題的新聞
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh')
        .is('title_en', null)
        .gte('published_at', thirtyDaysAgo.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching news:', error);
        return;
    }

    if (!items || items.length === 0) {
        console.log('✓ 所有新聞都已有英文版！');
        return;
    }

    console.log(`找到 ${items.length} 則缺少英文版的新聞\n`);

    // 分批處理（每批 5 則）
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        console.log(`處理第 ${i + 1}-${Math.min(i + batchSize, items.length)} 則...`);

        try {
            const results = await batchTranslateToEnglish(batch);

            for (const result of results) {
                if (result.id && result.title_en) {
                    const { error: updateError } = await supabase
                        .from('news_items')
                        .update({
                            title_en: result.title_en,
                            summary_en: result.summary_en || null
                        })
                        .eq('id', result.id);

                    if (updateError) {
                        console.error(`  ✗ 更新失敗 ${result.id}:`, updateError.message);
                    } else {
                        processedCount++;
                        console.log(`  ✓ ${result.title_en.substring(0, 50)}...`);
                    }
                }
            }

        } catch (e: any) {
            console.error(`  ✗ 批次翻譯失敗:`, e.message);
        }

        // 避免 API 限流
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n=== 完成！翻譯了 ${processedCount} 則新聞 ===\n`);
}

translateMissingEnglish();
