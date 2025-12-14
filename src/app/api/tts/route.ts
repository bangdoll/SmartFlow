
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client (Service Role for writing to Storage/DB)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { newsId } = await req.json();

        if (!newsId) {
            return NextResponse.json({ error: 'Missing newsId' }, { status: 400 });
        }

        // 1. Check if audio_url already exists
        const { data: newsItem, error: fetchError } = await supabase
            .from('news_items')
            .select('id, title, summary_zh, audio_url')
            .eq('id', newsId)
            .single();

        if (fetchError || !newsItem) {
            console.error('Error fetching news:', fetchError);
            return NextResponse.json({ error: 'News item not found' }, { status: 404 });
        }

        // Return cached URL if exists
        if (newsItem.audio_url) {
            return NextResponse.json({ audioUrl: newsItem.audio_url, status: 'cached' });
        }

        // 2. Generate Audio using OpenAI TTS
        const textToSpeak = `${newsItem.title}。${newsItem.summary_zh || ''}`;

        // Limit text length to avoid limits (max 4096 chars usually, but keep it shorter for cost)
        const truncatedText = textToSpeak.slice(0, 1000);

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // 'alloy', 'echo', 'fable', 'onyx', 'nova', and 'shimmer'
            input: truncatedText,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // 3. Upload to Supabase Storage
        const fileName = `${newsId}.mp3`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('news-audio')
            .upload(fileName, buffer, {
                contentType: 'audio/mpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error('Failed to upload audio');
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('news-audio')
            .getPublicUrl(fileName);

        // 5. Update Database
        const { error: updateError } = await supabase
            .from('news_items')
            .update({ audio_url: publicUrl })
            .eq('id', newsId);

        if (updateError) {
            console.error('Update DB Error:', updateError);
            // Verify if update failed we still return the URL logic? 
            // We should probably throw to inform frontend something went wrong, or validly return the URL but log error.
        }

        return NextResponse.json({ audioUrl: publicUrl, status: 'generated' });

    } catch (error: any) {
        console.error('TTS API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
