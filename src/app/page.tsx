import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';

// 設定 Revalidation 時間 (例如每小時更新一次，或更短)
// 避免靜態生成，因為我們要讀取 searchParams
// 設定 Revalidation 時間
export const revalidate = 60; // 每分鐘更新

async function getLatestNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50); // 增加抓取數量以支援前端篩選

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return data as NewsItem[];
}

export default async function Home() {
  const newsItems = await getLatestNews();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 text-center md:text-left">
        {/* 標題與簡介現在整合進 NewsFeed 或由 NewsFeed 控制顯示狀態，
             但為了設計層次，我們保留一個靜態大標題，篩選狀態由 Feed 內部顯示 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">最新 AI 趨勢</h1>
        <p className="text-gray-600 dark:text-gray-400">
          每日精選全球人工智慧新聞摘要
        </p>
      </div>

      <NewsFeed items={newsItems} />

      <SubscribeForm />
    </div>
  );
}
