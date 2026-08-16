
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';

function getOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    return new OpenAI({ apiKey });
}

// Initialize Supabase Admin Client (Service Role for writing to Storage/DB)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseServiceKey) throw new Error('Missing Supabase server key');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to optimize text for TTS reading
function formatSummaryForTTS(text: string): string {
    if (!text) return '';

    // Split into lines to process robustly
    const lines = text.split('\n');
    const processedLines: string[] = [];

    let inTable = false;
    const pros: string[] = [];
    const cons: string[] = [];

    // Regex to match header flexibility (spaces are optional)
    // Matches: | 正面影響 | 挑戰與風險 |  OR  |正面影響|挑戰與風險|
    const headerRegex = /\|\s*正面影響\s*\|\s*挑戰與風險\s*\|/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect start of specific table
        if (headerRegex.test(line)) {
            inTable = true;
            continue; // Skip header
        }

        if (inTable) {
            // Detect separator line |---|---|
            if (line.match(/^\|[-:\s|]+\|$/)) {
                continue;
            }

            // Detect end of table (empty line or not start with |)
            if (!line.startsWith('|')) {
                inTable = false;
                // Flush table content to processed lines
                if (pros.length > 0 || cons.length > 0) {
                    processedLines.push(`正面影響包括：${pros.join('，')}。`);
                    processedLines.push(`挑戰與風險包括：${cons.join('，')}。`);
                }
                pros.length = 0;
                cons.length = 0;

                processedLines.push(line); // Add the current non-table line
                continue;
            }

            // Parse Row: | Content A | Content B |
            const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
            if (cells.length >= 2) {
                // Remove extra markdown chars if any inside cells
                pros.push(cells[0].replace(/\*\*/g, ''));
                cons.push(cells[1].replace(/\*\*/g, ''));
            }
        } else {
            // Normal line
            processedLines.push(line);
        }
    }

    // In case table was at the very end
    if (inTable && (pros.length > 0 || cons.length > 0)) {
        processedLines.push(`正面影響包括：${pros.join('，')}。`);
        processedLines.push(`挑戰與風險包括：${cons.join('，')}。`);
    }

    let processed = processedLines.join('\n');

    // Remove other markdown artifacts if needed, e.g. **bold** -> text
    processed = processed.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
    processed = processed.replace(/\[(.*?)\]/g, ''); // Remove [Paragraph 1...] if any left
    processed = processed.replace(/^\s*[-*]\s+/gm, ''); // Remove list bullets

    // Remove "White vernacular", "Impact on you" headers to flow better?
    processed = processed.replace(/[🧠⚠️✅💡🗣️👔]/g, '');
    processed = processed.replace(/\s+/g, ' '); // Collapse whitespaces

    return processed;
}

export async function POST(req: NextRequest) {
    try {
        const parsed = z.object({
            newsId: z.string().uuid(),
            lang: z.enum(['zh-TW', 'en']).default('zh-TW'),
        }).safeParse(await req.json());

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid newsId or language' }, { status: 400 });
        }

        const { newsId, lang } = parsed.data;
        const targetLang = lang === 'en' ? 'en' : 'zh';
        const audioColumn: 'audio_url_en' | 'audio_url' = targetLang === 'en' ? 'audio_url_en' : 'audio_url';

        // 1. Check if audio_url already exists
        // Always fetch summary_zh as fallback source for translation
        const { data: newsItem, error: fetchError } = await supabase
            .from('news_items')
            .select(`id, title, title_en, summary_zh, summary_en, audio_url, audio_url_en`)
            .eq('id', newsId)
            .single();

        if (fetchError || !newsItem) {
            console.error('Error fetching news:', fetchError);
            return NextResponse.json({ error: 'News item not found' }, { status: 404 });
        }

        const cachedAudioUrl = targetLang === 'en' ? newsItem.audio_url_en : newsItem.audio_url;
        if (cachedAudioUrl) {
            return NextResponse.json({ audioUrl: cachedAudioUrl, status: 'cached' });
        }

        // 2. Generate Audio using OpenAI TTS
        let cleanTitle = targetLang === 'en' ? newsItem.title_en || newsItem.title || '' : newsItem.title || '';
        let cleanSummary = '';
        let rawSummary = targetLang === 'en' ? newsItem.summary_en || '' : newsItem.summary_zh || '';

        if (targetLang === 'en') {
            // ENGLISH MODE

            // A. Handle Title
            if (newsItem.title_en) {
                cleanTitle = newsItem.title_en;
            } else {
                console.log('Missing title_en, translating title...');
                const titleTranslation = await getOpenAI().chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "Translate this news title to English. Only output the translation." },
                        { role: "user", content: cleanTitle }
                    ]
                });
                const translatedTitle = titleTranslation.choices[0]?.message?.content?.trim();
                if (translatedTitle) {
                    cleanTitle = translatedTitle;
                    // Async update DB
                    supabase.from('news_items').update({ title_en: translatedTitle }).eq('id', newsId).then();
                }
            }

            // B. Handle Summary
            // For English, check if we have summary_en. If not, generate (translate) it from summary_zh.
            if (!rawSummary && newsItem.summary_zh) {
                console.log('Missing summary_en, generating translation...');
                const translationCompletion = await getOpenAI().chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional translator. Translate the following Traditional Chinese news summary into English. Keep the format (paragraphs) but remove any 'Pros/Cons' tables or complex markdown, just give a clear 2-3 paragraph summary. Do not include 'Here is the translation' or similar intros."
                        },
                        {
                            role: "user",
                            content: newsItem.summary_zh
                        }
                    ],
                    temperature: 0.3,
                });

                const sensitiveTranslation = translationCompletion.choices[0]?.message?.content || '';

                if (sensitiveTranslation) {
                    rawSummary = sensitiveTranslation;

                    // Helper: Optimization - Save this to DB so we don't translate again
                    // We doing this asynchronously effectively, or waiting?
                    // Let's wait to ensure consistency.
                    await supabase
                        .from('news_items')
                        .update({ summary_en: sensitiveTranslation })
                        .eq('id', newsId);
                }
            }

            // Clean up
            cleanSummary = rawSummary
                .replace(/\[Paragraph.*?\]/g, '')
                .replace(/\*\*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        } else {
            // For Chinese, use the specific format function
            cleanSummary = formatSummaryForTTS(rawSummary);
        }

        const textToSpeak = `${cleanTitle}。${cleanSummary}`;

        // Limit text length
        const truncatedText = textToSpeak.slice(0, 4000);

        const mp3 = await getOpenAI().audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: truncatedText,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // 3. Upload to Supabase Storage
        // Use unique filename with lang suffix
        const fileName = `${newsId}_${targetLang}.mp3`;
        const { error: uploadError } = await supabase
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
        const updatePayload: { audio_url?: string; audio_url_en?: string } = {};
        updatePayload[audioColumn] = publicUrl;

        const { error: updateError } = await supabase
            .from('news_items')
            .update(updatePayload)
            .eq('id', newsId);

        if (updateError) {
            console.error('Update DB Error:', updateError);
        }

        // Return URL with client-side cache buster
        return NextResponse.json({ audioUrl: `${publicUrl}?t=${Date.now()}`, status: 'generated' });

    } catch (error: unknown) {
        console.error('TTS API Error:', error);
        return NextResponse.json({ error: 'Audio generation is temporarily unavailable' }, { status: 503 });
    }
}
