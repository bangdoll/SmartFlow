import { supabase } from '@/lib/supabase';
import { MonthlyView } from '@/components/monthly-view';
import { NewsItem } from '@/types';

export const revalidate = 3600; // 1 小時重新驗證

// 獲取過去 30 天的新聞
async function getMonthlyNews(): Promise<NewsItem[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .gte('published_at', thirtyDaysAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('Error fetching monthly news:', error);
        return [];
    }

    return data as NewsItem[];
}

// 計算月度熱門標籤
function calculateMonthlyTrends(newsItems: NewsItem[]) {
    const tagCounts: Record<string, number> = {};

    newsItems.forEach(item => {
        item.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
}

// 按週分組新聞
function groupByWeek(newsItems: NewsItem[]) {
    const weeks: Record<string, NewsItem[]> = {};

    newsItems.forEach(item => {
        const date = new Date(item.published_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // 週日開始
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeks[weekKey]) {
            weeks[weekKey] = [];
        }
        weeks[weekKey].push(item);
    });

    return Object.entries(weeks)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([weekStart, items]) => ({
            weekStart,
            items: items.slice(0, 10) // 每週最多顯示 10 則
        }));
}

export default async function MonthlyPage() {
    const newsItems = await getMonthlyNews();
    const trends = calculateMonthlyTrends(newsItems);
    const weeklyGroups = groupByWeek(newsItems);

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <MonthlyView
                newsItems={newsItems}
                trends={trends}
                weeklyGroups={weeklyGroups}
            />
        </div>
    );
}
