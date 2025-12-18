import { NewsFeed } from '@/components/news-feed';
import { SubscribeForm } from '@/components/subscribe-form';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { WelcomeSection } from '@/components/welcome-section';
import { HotNewsSection } from '@/components/hot-news';
import { PinnedGuideCard } from '@/components/pinned-guide-card';
import { DailyInsight } from '@/components/daily-insight';

// 使用 ISR (增量靜態再生)，每 5 分鐘更新一次
export const revalidate = 300;

async function getHotNews() {
  const { data: items } = await supabase
    .from('news_items')
    .select('id, title, original_url, summary_zh, summary_en, title_en, slug, published_at, source, tags, click_count, created_at')
    .order('click_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(3);

  return items || [];
}

async function getLatestNews(): Promise<NewsItem[]> {
  const { data: items } = await supabase
    .from('news_items')
    .select('id, title, original_url, summary_zh, summary_en, title_en, slug, published_at, source, tags, click_count, created_at')
    .order('published_at', { ascending: false })
    .limit(50);

  return items || [];
}

export default async function Home() {
  const [items] = await Promise.all([
    getLatestNews()
  ]);

  // Wireframe 2 Logic: Only show Top 5. No more.
  const focusItems = items.slice(0, 5);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24 sm:pt-12">
        {/* Wireframe 1: Entrance Ramp */}
        <WelcomeSection />

        {/* Wireframe 2: Today's Focus List */}
        <div id="news-feed" className="mt-8 transition-opacity duration-1000">
          <NewsFeed initialItems={focusItems} mode="focus" />
        </div>

        {/* Subscribe Form (Target for #subscribe anchor) */}
        <SubscribeForm />
      </div>
    </main>
  );
}
