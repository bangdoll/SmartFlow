import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Schema Definition for Weekly Trends
const TrendItemSchema = z.object({
    tag: z.string().describe('The trend keyword (e.g., AI, Innovation, Google).'),
    count: z.number().describe('Number of news items related to this trend.'),
    title: z.string().describe('A catchy, insight-driven title for this trend section.'),
    desc: z.string().describe('A brief description of the trend context.'),
    signal: z.string().describe('The core signal/implication of this trend (What it really means).')
});

const PersonaAdviceSchema = z.object({
    general: z.string().describe('Advice for general users (e.g., watch out for privacy).'),
    employee: z.string().describe('Advice for employees (e.g., how it affects workflow).'),
    boss: z.string().describe('Advice for bosses/managers (e.g., risk vs investment).')
});

const WeeklyTrendsSchema = z.object({
    title: z.string().describe('The main title for the weekly issue in Traditional Chinese.'),
    title_en: z.string().describe('The main title for the weekly issue in English.'),
    core_message: z.string().describe('The single most important takeaway sentence in Traditional Chinese.'),
    core_message_en: z.string().describe('The single most important takeaway sentence in English.'),
    trends: z.array(TrendItemSchema).describe('List of top 6-10 trends.'),
    persona_advice: PersonaAdviceSchema.describe('Tailored advice for different roles in Traditional Chinese.'),
    persona_advice_en: PersonaAdviceSchema.describe('Tailored advice for different roles in English.')
});

export async function generateWeeklyTrends() {
    // 1. Fetch news from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: newsItems, error } = await supabase
        .from('news_items')
        .select('title, summary_zh, tags')
        .gte('published_at', sevenDaysAgo.toISOString())
        .limit(200); // Limit to avoid hitting context window limits

    if (error || !newsItems || newsItems.length === 0) {
        console.error('Error fetching news for trends:', error);
        return null;
    }

    // 2. Prepare context for LLM
    // We summarize the input to save tokens but keep titles and partial summaries
    const newsContext = newsItems.map(item => `
        Title: ${item.title}
        Tags: ${item.tags?.join(', ')}
        Summary: ${item.summary_zh?.slice(0, 200)}...
    `).join('\n---\n');

    const prompt = `
        You are an expert AI Trend Analyst.
        Your task is to analyze the following news items from the past week and generate a "Weekly Direction" report.
        
        Input News:
        ${newsContext}
        
        Requirements:
        1. **Core Message**: Synthesize one single, powerful sentence that describes the "Phase" or "Main Theme" of this week.
        2. **Trends Extraction**: Identify 6 key trends/keywords.
        3. **Mental Model Analysis**: Select 3 relevant "Charlie Munger Mental Models" (e.g., Opportunity Cost, Inversion, Second-Order Thinking, Network Effects, etc.) that best explain this week's events. Use these models to frame your insights.
        4. **Persona Advice**: Give specific, actionable advice for General User, Employee, and Boss, incorporating the selected mental models where appropriate.
        5. **Bilingual Output**: Provide Title, Core Message, and Advice in BOTH Traditional Chinese (Taiwan) and English.
        6. Tone: Professional, insightful, yet accessible. Like a "Decision Helper".
    `;

    // 3. Generate Insights
    try {
        const result = await generateObject({
            model: openai('gpt-4o'),
            schema: WeeklyTrendsSchema,
            prompt: prompt,
        });

        return result.object;
    } catch (e) {
        console.error('Error in LLM Trend Generation:', e);
        throw e;
    }
}

// Helper to get the Monday of the current week (or last Monday)
function getMonday(d: Date) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

export async function saveWeeklyTrendsToDb(trendsData: z.infer<typeof WeeklyTrendsSchema>) {
    const today = new Date();
    const weekStartDate = getMonday(today).toISOString().split('T')[0]; // YYYY-MM-DD

    const { error } = await supabase
        .from('weekly_trends')
        .upsert({
            week_start_date: weekStartDate,
            title: trendsData.title,
            title_en: trendsData.title_en,
            core_message: trendsData.core_message,
            core_message_en: trendsData.core_message_en,
            trends: trendsData.trends,
            persona_advice: trendsData.persona_advice,
            persona_advice_en: trendsData.persona_advice_en,
            created_at: new Date().toISOString()
        }, { onConflict: 'week_start_date' });

    if (error) {
        throw new Error(`Supabase Insert Error: ${error.message}`);
    }

    return weekStartDate;
}
