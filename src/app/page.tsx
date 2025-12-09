import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';

// 設定 Revalidation 時間 (例如每小時更新一次，或更短)
// 避免靜態生成，因為我們要讀取 searchParams
export const dynamic = 'force-dynamic';

async function getLatestNews(tag?: string): Promise<NewsItem[]> {
  let query = supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return data as NewsItem[];
}

export default async function Home({ searchParams }: { searchParams: { tag?: string } }) {
  const tag = searchParams.tag;
  const newsItems = await getLatestNews(tag);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {tag ? `Tag: #${tag}` : '最新 AI 趨勢'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
          {tag ? (
            <>
              <span>顯示關於 {tag} 的精選新聞</span>
              <a href="/" className="text-sm text-blue-500 hover:underline px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">清除篩選 ✕</a>
            </>
          ) : (
            '每日精選全球人工智慧新聞摘要'
          )}
        </p>
      </div>

      <NewsFeed items={newsItems} />

      <SubscribeForm />
    </div>
  );
}
