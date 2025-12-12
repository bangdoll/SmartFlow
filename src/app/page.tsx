import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';

// 強制動態渲染，不使用快取
export const dynamic = 'force-dynamic';

import { HotNewsSection } from '@/components/hot-news';


async function getHotNews() {
  const { data: items } = await supabase
    .from('news_items')
    .select('*')
    .order('click_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(3);

  return items || [];
}

async function getLatestNews(): Promise<NewsItem[]> {
  const { data: items } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  return items || [];
}

export default async function Home() {
  const [hotItems, items] = await Promise.all([
    getHotNews(),
    getLatestNews()
  ]);

  // 防止熱門新聞與最新新聞重複顯示有點複雜，因為最新新聞列表是用來瀏覽的。
  // 簡單起見，我們允許重複，因為熱門區塊是強調。
  // 但如果想更精緻，可以過濾，但 Client Side 分頁會變得複雜。
  // 暫時保持獨立。

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />



      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
        <div className="space-y-2 mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
              全球 AI 科技快報
            </h1>
            <span className="block text-2xl sm:text-3xl font-medium text-gray-600 dark:text-gray-400">
              洞察人工智慧的未來
            </span>
          </h1>
        </div>

        {/* Hot News Section */}
        <HotNewsSection items={hotItems} />

        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">最新動態</h2>
        </div>

        <NewsFeed items={items} />

        <div className="mt-20">
          <SubscribeForm />
        </div>
      </div>


    </main>
  );
}
