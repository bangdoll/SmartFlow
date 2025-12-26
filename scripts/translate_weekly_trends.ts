/**
 * Script to translate weekly_trends content to English
 * 
 * Usage: npx ts-node scripts/translate_weekly_trends.ts
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

interface WeeklyTrend {
    id: string;
    title: string;
    title_en?: string;
    core_message: string;
    core_message_en?: string;
    persona_advice: Record<string, string>;
    persona_advice_en?: Record<string, string>;
    week_start_date: string;
}

async function translateText(chineseText: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are a professional translator. Translate the following Traditional Chinese text to natural, fluent English. Maintain the meaning and tone. Output only the translation, no explanations.',
            },
            {
                role: 'user',
                content: chineseText,
            },
        ],
        temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || '';
}

async function translatePersonaAdvice(
    personaAdvice: Record<string, string>
): Promise<Record<string, string>> {
    const translated: Record<string, string> = {};

    // Translate all entries in one request for efficiency
    const entries = Object.entries(personaAdvice);
    const combined = entries.map(([role, advice]) => `[${role}]: ${advice}`).join('\n');

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a professional translator. Translate the following role-based advice from Traditional Chinese to English.
Each line has format "[Role]: advice text". Translate both the role name and the advice.
Output in the same format, one line per role. Example:
[General Public]: Stay informed about...
[Professionals]: Consider the implications...
[Business Leaders]: Evaluate the strategic...`,
            },
            {
                role: 'user',
                content: combined,
            },
        ],
        temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || '';

    // Parse the translated text back into a record
    const lines = translatedText.split('\n');
    for (const line of lines) {
        const match = line.match(/^\[(.+?)\]:\s*(.+)$/);
        if (match) {
            translated[match[1]] = match[2];
        }
    }

    // Fallback: if parsing failed, use original keys with translated values
    if (Object.keys(translated).length === 0) {
        for (const [key, value] of entries) {
            translated[key] = await translateText(value);
        }
    }

    return translated;
}

async function translateWeeklyTrends(): Promise<void> {
    console.log('🔄 Fetching weekly trends without English translations...\n');

    // Fetch all weekly trends that need translation
    const { data: trends, error: fetchError } = await supabase
        .from('weekly_trends')
        .select('*')
        .or('title_en.is.null,core_message_en.is.null,persona_advice_en.is.null')
        .order('week_start_date', { ascending: false });

    if (fetchError) {
        console.error('❌ Error fetching weekly trends:', fetchError);
        return;
    }

    if (!trends || trends.length === 0) {
        console.log('✅ All weekly trends already have English translations!');
        return;
    }

    console.log(`📋 Found ${trends.length} weekly trends to translate\n`);

    let successCount = 0;
    for (const trend of trends as WeeklyTrend[]) {
        console.log(`\n📅 Processing week: ${trend.week_start_date}`);
        console.log(`   Title: ${trend.title.substring(0, 50)}...`);

        try {
            // Translate title if needed
            let titleEn = trend.title_en;
            if (!titleEn) {
                console.log('   🔤 Translating title...');
                titleEn = await translateText(trend.title);
                console.log(`   ✓ Title EN: ${titleEn.substring(0, 50)}...`);
            }

            // Translate core message if needed
            let coreMessageEn = trend.core_message_en;
            if (!coreMessageEn) {
                console.log('   🔤 Translating core message...');
                coreMessageEn = await translateText(trend.core_message);
                console.log(`   ✓ Core message translated`);
            }

            // Translate persona advice if needed
            let personaAdviceEn = trend.persona_advice_en;
            if (!personaAdviceEn && trend.persona_advice) {
                console.log('   🔤 Translating persona advice...');
                personaAdviceEn = await translatePersonaAdvice(trend.persona_advice);
                console.log(`   ✓ Persona advice translated (${Object.keys(personaAdviceEn).length} roles)`);
            }

            // Update database
            const { error: updateError } = await supabase
                .from('weekly_trends')
                .update({
                    title_en: titleEn,
                    core_message_en: coreMessageEn,
                    persona_advice_en: personaAdviceEn,
                })
                .eq('id', trend.id);

            if (updateError) {
                console.error(`   ❌ Update error:`, updateError);
            } else {
                console.log(`   ✅ Updated successfully!`);
                successCount++;
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`   ❌ Translation error:`, error);
        }
    }

    console.log(`\n✅ Translation complete! ${successCount}/${trends.length} weekly trends translated.`);
}

// Run the script
translateWeeklyTrends().catch(console.error);
