import { NewsFeed } from '@/components/news-feed';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { PageHeader } from '@/components/page-header';

export const revalidate = 300; // 5 分鐘重新驗證

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
        <div className="max-w-3xl mx-auto pt-24 px-4 sm:px-6">
            <PageHeader titleKey="archive.title" subtitleKey="archive.subtitle" />

            <NewsFeed initialItems={newsItems} />
        </div>
    );
}
