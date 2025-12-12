import { NewsFeed } from '@/components/news-feed';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';

export const revalidate = 3600;

async function getAllNews(): Promise<NewsItem[]> {
    // 只顯示 24 小時之前的新聞（歷史）
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .lt('published_at', oneDayAgo.toISOString()) // 只取 24 小時前的
        .order('published_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching news:', error);
        return [];
    }

    return data as NewsItem[];
}

export default async function ArchivePage() {
    const newsItems = await getAllNews();

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">歷史摘要</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    瀏覽過往的 AI 新聞紀錄
                </p>
            </div>

            <NewsFeed items={newsItems} />
        </div>
    );
}
