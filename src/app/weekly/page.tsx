import { supabase } from '@/lib/supabase';
import { WeeklyView } from '@/components/weekly-view';
import { NewsItem } from '@/types';

export const revalidate = 300; // 5 分鐘重新驗證

// 獲取過去 7 天的新聞
async function getWeeklyNews(): Promise<NewsItem[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
}

// 獲取最新週報分析
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
        persona_advice: data.persona_advice,
        week_start_date: data.week_start_date,
        week_end_date: data.week_end_date
    };
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
