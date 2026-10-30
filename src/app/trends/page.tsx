import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { TrendsView } from '@/components/trends-view';

export const revalidate = 3600;

// Helper to get latest trends from DB
async function getLatestWeeklyTrends() {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('weekly_trends')
        .select('title, title_en, core_message, core_message_en, trends, persona_advice, persona_advice_en, week_start_date, week_end_date')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error('Unable to load weekly trends', { cause: error });
    if (!data) return null;

    return {
        title: data.title,
        titleEn: data.title_en,
        core_message: data.core_message,
        coreMessageEn: data.core_message_en,
        trends: data.trends,
        persona_advice: data.persona_advice,
        personaAdviceEn: data.persona_advice_en
    };
}

export default async function TrendsPage() {
    const dbTrends = await getLatestWeeklyTrends();

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            {/* Header handled by layout */}

            <TrendsView initialData={dbTrends} />
        </main>
    );
}
