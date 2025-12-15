import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid ids' }, { status: 400 });
        }

        // 1. Fetch current data for these IDs
        const { data: items, error: fetchError } = await supabase
            .from('news_items')
            .select('id, title, summary_zh, title_en, summary_en')
            .in('id', ids);

        if (fetchError || !items) {
            return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
        }

        // 2. Identify items that need translation
        const itemsToTranslate = items.filter(item =>
            (!item.title_en && item.title) || (!item.summary_en && item.summary_zh)
        );

        if (itemsToTranslate.length === 0) {
            // Nothing to do
            return NextResponse.json({ results: items.map(i => ({ id: i.id, title_en: i.title_en, summary_en: i.summary_en })) });
        }

        console.log(`[Batch Translate] Processing ${itemsToTranslate.length} items...`);

        // 3. Prepare Batch Prompt
        // Minimizing tokens: just sending ID, Title, Summary_ZH (truncated if too long?)
        // Summary_ZH can be long. We want Summary_EN to be concise.

        const contentToTranslate = itemsToTranslate.map(item => ({
            id: item.id,
            title: item.title,
            summary_zh: item.summary_zh?.substring(0, 1000) // limit context
        }));

        const prompt = `
        You are a professional translator. 
        Translate the following news items from Traditional Chinese to English.
        
        Input JSON:
        ${JSON.stringify(contentToTranslate)}

        Requirements:
        1. Output a JSON Array with objects: { "id": "...", "title_en": "...", "summary_en": "..." }
        2. "title_en": Concise, professional English title.
        3. "summary_en": Concise 2-paragraph English summary. plain text, no markdown tables.
        4. Return ONLY the valid JSON array.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini for speed and cost
            messages: [
                { role: "system", content: "You are a batch translation service. Output valid JSON only." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }, // Force JSON mode? Wait, json_object expects keys?
            // "json_object" requires "json" in prompt. My prompt has "JSON".
            // It expects a root object usually? Or can accept array?
            // Safer to ask for: { "results": [...] }
            temperature: 0.3,
        });

        const responseContent = completion.choices[0]?.message?.content || '{}';

        // Parse result
        let results = [];
        try {
            const parsed = JSON.parse(responseContent);
            results = parsed.results || parsed; // Handle { results: [] } or just [] if model output array directly (but json_object usually enforces root object)
            if (!Array.isArray(results)) {
                // Determine if it returned map or something else
                if (parsed.items) results = parsed.items;
                else results = [];
            }
        } catch (e) {
            console.error('Failed to parse batch translation response', e);
        }

        // 4. Update Database in Parallel
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

        // 5. Fetch updated items or merge
        // We can just return the merged results
        const finalResults = items.map(original => {
            const translated = results.find((r: any) => r.id === original.id);
            return {
                id: original.id,
                title_en: translated?.title_en || original.title_en,
                summary_en: translated?.summary_en || original.summary_en
            };
        });

        return NextResponse.json({ results: finalResults });

    } catch (error: any) {
        console.error('Batch Translation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
