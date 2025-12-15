
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- DEBUG START ---');
    // Debug: Inspect latest 5 items
    const { data: debugItems } = await supabase
        .from('news_items')
        .select('id, title, title_en, summary_en')
        .order('published_at', { ascending: false })
        .limit(5);

    console.log('--- DEBUG: Latest 5 Items ---');
    debugItems?.forEach(item => {
        console.log(`[${item.id}] TitleEn: "${item.title_en}" (${typeof item.title_en}) | SummaryEn: "${item.summary_en ? 'PRESENT' : 'NULL'}"`);
    });
    console.log('-----------------------------');

    const limit = 20;

    // 1. Find items with empty title_en OR summary_en
    const { data: pendingItems, error } = await supabase
        .from('news_items')
        .select('id')
        .or('title_en.is.null,summary_en.is.null')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Pending fetch error:', error);
        return;
    }

    if (!pendingItems || pendingItems.length === 0) {
        console.log('[Translation Service] No pending items found.');
        return;
    }

    const ids = pendingItems.map(i => i.id);
    console.log(`[Translation Service] Found ${ids.length} pending items. Translating...`);

    // --- Batch Translate Logic ---
    const { data: items, error: fetchError } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en')
        .in('id', ids);

    if (fetchError || !items) {
        console.error('Failed to fetch items:', fetchError);
        return;
    }

    const itemsToTranslate = items.filter(item =>
        (!item.title_en && item.title) || (!item.summary_en && item.summary_zh)
    );

    if (itemsToTranslate.length === 0) return;

    const contentToTranslate = itemsToTranslate.map(item => ({
        id: item.id,
        title: item.title,
        summary_zh: item.summary_zh?.substring(0, 1000)
    }));

    const prompt = `
    You are a professional translator. 
    Translate the following news items from Traditional Chinese to English.
    
    Input JSON:
    ${JSON.stringify(contentToTranslate)}

    Requirements:
    1. Output a JSON Object with a "results" key containing an array.
    2. Format: { "results": [{ "id": "...", "title_en": "...", "summary_en": "..." }] }
    3. "title_en": Concise, professional English title.
    4. "summary_en": Concise 2-paragraph English summary. plain text.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a batch translation service. Output valid JSON only." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseContent);
        const results = parsed.results || [];

        const updatePromises = results.map(async (res: any) => {
            if (res.id && (res.title_en || res.summary_en)) {
                return supabase
                    .from('news_items')
                    .update({
                        title_en: res.title_en,
                        summary_en: res.summary_en
                    })
                    .eq('id', res.id);
            }
        });

        await Promise.all(updatePromises);
        console.log(`Backfilled ${results.length} items.`);

    } catch (error) {
        console.error('Translation Error:', error);
    }
}

main();
