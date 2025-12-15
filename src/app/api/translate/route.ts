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
        const { newsId } = await req.json();

        if (!newsId) {
            return NextResponse.json({ error: 'Missing newsId' }, { status: 400 });
        }

        // 1. Fetch current data
        const { data: newsItem, error: fetchError } = await supabase
            .from('news_items')
            .select('id, title, summary_zh, title_en, summary_en')
            .eq('id', newsId)
            .single();

        if (fetchError || !newsItem) {
            return NextResponse.json({ error: 'News item not found' }, { status: 404 });
        }

        let needsUpdate = false;
        let titleEn = newsItem.title_en;
        let summaryEn = newsItem.summary_en;

        // 2. Translate Title if missing
        if (!titleEn && newsItem.title) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Translate this news title to English. Be concise and professional."
                    },
                    {
                        role: "user",
                        content: newsItem.title
                    }
                ],
                temperature: 0.3,
            });
            titleEn = completion.choices[0]?.message?.content?.replace(/^"|"$/g, '') || '';
            if (titleEn) needsUpdate = true;
        }

        // 3. Translate Summary if missing (Logic similar to TTS route but purely for text)
        if (!summaryEn && newsItem.summary_zh) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional translator. Translate the following Traditional Chinese news summary into English. Keep the format (paragraphs) but remove any 'Pros/Cons' tables or complex markdown, just give a clear 2-3 paragraph summary."
                    },
                    {
                        role: "user",
                        content: newsItem.summary_zh
                    }
                ],
                temperature: 0.3,
            });
            summaryEn = completion.choices[0]?.message?.content || '';
            if (summaryEn) needsUpdate = true;
        }

        // 4. Update DB if needed
        if (needsUpdate) {
            await supabase
                .from('news_items')
                .update({
                    title_en: titleEn,
                    summary_en: summaryEn
                })
                .eq('id', newsId);
        }

        return NextResponse.json({
            title_en: titleEn,
            summary_en: summaryEn
        });

    } catch (error: any) {
        console.error('Translation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
