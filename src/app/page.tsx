import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { WelcomeSection } from '@/components/welcome-section';
import { HotNewsSection } from '@/components/hot-news';
import { PinnedGuideCard } from '@/components/pinned-guide-card';

// 強制動態渲染，不使用快取
export const dynamic = 'force-dynamic';

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Section for Newbies/Elderly */}
        <WelcomeSection />

        {/* Pinned User Guide Card - 置頂教學 */}
        <PinnedGuideCard />

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
