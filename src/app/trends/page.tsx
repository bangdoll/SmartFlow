import { supabase } from '@/lib/supabase';
import { TrendsView } from '@/components/trends-view';

// Helper to get latest trends from DB
async function getLatestWeeklyTrends() {
    const { data, error } = await supabase
        .from('weekly_trends')
        .select('*')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        title: data.title,
        core_message: data.core_message,
        trends: data.trends,
        persona_advice: data.persona_advice
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
