import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';

// 設定 Revalidation 時間 (例如每小時更新一次，或更短)
export const revalidate = 3600;

async function getLatestNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">最新 AI 趨勢</h1>
        <p className="text-gray-600">
          每日精選全球人工智慧新聞摘要
        </p>
      </div>

      <NewsFeed items={newsItems} />

      <SubscribeForm />
    </div>
  );
}
