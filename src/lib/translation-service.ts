import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TranslatedItem {
    id: string;
    title_en: string;
    summary_en: string;
}

/**
 * Translates a specific list of News Items by ID.
 */
export async function batchTranslate(ids: string[]): Promise<TranslatedItem[]> {
    if (!ids || ids.length === 0) return [];

    // 1. Fetch current data
    const { data: items, error: fetchError } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en')
        .in('id', ids);

    if (fetchError || !items) {
        console.error('Failed to fetch items for translation:', fetchError);
        return [];
    }

    // 2. Identify items that need translation
    const itemsToTranslate = items.filter(item =>
        (!item.title_en && item.title) || (!item.summary_en && item.summary_zh)
    );

    if (itemsToTranslate.length === 0) {
        return items.map(i => ({ id: i.id, title_en: i.title_en, summary_en: i.summary_en }));
    }

    console.log(`[Translation Service] Translating ${itemsToTranslate.length} items...`);

    // 3. Prepare Prompt
    const contentToTranslate = itemsToTranslate.map(item => ({
        id: item.id,
        title: item.title,
        summary_zh: item.summary_zh?.substring(0, 1000)
    }));

    const prompt = `
    You are a professional translator and AI analyst. 
    Translate the following news items from Traditional Chinese to English.
    
    Input JSON:
    ${JSON.stringify(contentToTranslate)}

    Requirements:
    1. Output a JSON Object with a "results" key containing an array.
    2. Format: { "results": [{ "id": "...", "title_en": "...", "summary_en": "..." }] }
    3. "title_en": Concise, professional English title.
    4. "summary_en": MUST follow this strict 3-part structure with emojis:
       🗣 **Plain English Breakdown**
       [Explain the news simply]

       ⚠️ **Impact on You**
       [Why this matters]

       ✅ **Actionable Advice**
       [What to do]
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

        // 4. Update Database
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

        // 5. Merge results
        return items.map(original => {
            const translated = results.find((r: any) => r.id === original.id);
            return {
                id: original.id,
                title_en: translated?.title_en || original.title_en,
                summary_en: translated?.summary_en || original.summary_en
            };
        });

    } catch (error) {
        console.error('Translation Error:', error);
        return [];
    }
}

/**
 * Finds pending items (missing English) and translates them.
 * Used by Cron Jobs.
 */
export async function translatePendingItems(limit = 10) {
    // 1. Find items with empty title_en
    const { data: pendingItems, error } = await supabase
        .from('news_items')
        .select('id')
        .is('title_en', null)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error || !pendingItems || pendingItems.length === 0) {
        console.log('[Translation Service] No pending items found.');
        return 0;
    }

    const ids = pendingItems.map(i => i.id);
    console.log(`[Translation Service] Found ${ids.length} pending items. triggering batchTranslate...`);

    await batchTranslate(ids);

    return ids.length;
}
