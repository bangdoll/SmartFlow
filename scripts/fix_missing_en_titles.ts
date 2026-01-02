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

async function translateToEnglish(titleZh: string): Promise<{ title_en: string; summary_en: string }> {
    const prompt = `Translate the following Traditional Chinese news title to professional English:

Chinese Title: ${titleZh}

Output JSON format:
{
  "title_en": "Professional English title",
  "summary_en": "Brief one-sentence English description"
}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
}

async function fixMissingEnglishTitles() {
    console.log('🔧 Fixing items missing English titles...\n');

    // Get items without title_en from last 14 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const { data: items } = await supabase
        .from('news_items')
        .select('id, title, title_en, summary_zh, summary_en')
        .gte('published_at', cutoffDate.toISOString())
        .is('title_en', null);

    console.log(`Found ${items?.length || 0} items missing title_en\n`);

    let fixed = 0;
    for (const item of items || []) {
        console.log(`Processing: ${item.title?.substring(0, 40)}...`);

        const result = await translateToEnglish(item.title);

        if (result.title_en) {
            const updateData: Record<string, string> = { title_en: result.title_en };
            if (!item.summary_en && result.summary_en) {
                updateData.summary_en = result.summary_en;
            }

            await supabase.from('news_items')
                .update(updateData)
                .eq('id', item.id);
            console.log(`  ✓ → ${result.title_en}`);
            fixed++;
        } else {
            console.log(`  ✗ Translation failed`);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✅ Fixed ${fixed} items!`);
}

fixMissingEnglishTitles();
