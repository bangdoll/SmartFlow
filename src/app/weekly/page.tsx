import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { WeeklyView } from '@/components/weekly-view';
import { NewsItem } from '@/types';

interface WeeklyTrendRecord {
    topic?: unknown;
    tag?: unknown;
    count?: unknown;
    sentiment?: unknown;
}

export const revalidate = 3600; // 每小時重新驗證，避免無必要的 ISR 寫入

// 獲取過去 7 天的新聞
async function getWeeklyNews(): Promise<NewsItem[]> {
    if (!isSupabaseConfigured()) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const { data, error } = await supabase
            .from('news_items')
            .select('*')
            .gte('published_at', sevenDaysAgo.toISOString())
            .order('published_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching weekly news:', error);
            return [];
        }

        return data as NewsItem[];
    } catch (error) {
        console.warn('Weekly news unavailable without Supabase:', error);
        return [];
    }
}

// 獲取最新週報分析
async function getLatestWeeklyTrends() {
    if (!isSupabaseConfigured()) return null;

    try {
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
            titleEn: data.title_en,
            core_message: data.core_message,
            coreMessageEn: data.core_message_en,
            trends: Array.isArray(data.trends) ? data.trends.map((trend: WeeklyTrendRecord) => ({
                topic: typeof trend.topic === 'string' ? trend.topic : typeof trend.tag === 'string' ? trend.tag : 'Unknown',
                count: typeof trend.count === 'number' ? trend.count : 0,
                sentiment: typeof trend.sentiment === 'string' ? trend.sentiment : undefined
            })) : [],
            persona_advice: data.persona_advice,
            personaAdviceEn: data.persona_advice_en,
            week_start_date: data.week_start_date,
            week_end_date: data.week_end_date
        };
    } catch (error) {
        console.warn('Weekly trends unavailable without Supabase:', error);
        return null;
    }
}

export default async function WeeklyPage() {
    const [newsItems, trendsData] = await Promise.all([
        getWeeklyNews(),
        getLatestWeeklyTrends()
    ]);

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <WeeklyView newsItems={newsItems} trendsData={trendsData} />
        </div>
    );
}
