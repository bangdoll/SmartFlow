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

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'fallback-1',
    title: 'OpenAI 推出新模型，推理解決能力大幅提升 (System Fallback)',
    title_en: 'OpenAI Launches New Model with Enhanced Reasoning Capabilities',
    original_url: '#',
    summary_zh: '由於系統正在維護中，目前顯示為備用內容。OpenAI 發布了新一代推理模型，專注於解決複雜的數學與程式設計問題，標誌著通用人工智慧的重要一步。',
    summary_en: 'System is currently under maintenance. Displaying fallback content. OpenAI has released a new generation reasoning model focused on solving complex math and programming problems, marking a significant step towards AGI.',
    source: 'System Recovery',
    published_at: new Date().toISOString(),
    tags: ['AI', 'OpenAI', 'Maintenance'],
    slug: 'fallback-openai-new-model'
  },
  {
    id: 'fallback-2',
    title: 'Google DeepMind 宣佈生物學新突破 (System Fallback)',
    title_en: 'Google DeepMind Announces New Biology Breakthrough',
    original_url: '#',
    summary_zh: '系統維護中。AlphaFold 最新版本成功預測了更複雜的蛋白質交互作用，將加速新藥開發流程。',
    summary_en: 'System maintenance. The latest version of AlphaFold successfully predicts more complex protein interactions, accelerating drug discovery processes.',
    source: 'System Recovery',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    tags: ['BioTech', 'Google', 'AI'],
    slug: 'fallback-deepmind-bio'
  },
  {
    id: 'fallback-3',
    title: '歐盟通過 AI 法案，全球監管進入新時代 (System Fallback)',
    title_en: 'EU Passes AI Act, Global Regulation Enters New Era',
    original_url: '#',
    summary_zh: '系統維護中。歐盟正式通過人工智慧法案，對高風險 AI 應用實施嚴格規範，預計將影響全球科技巨頭的佈局。',
    summary_en: 'System maintenance. The EU has officially passed the AI Act, implementing strict regulations on high-risk AI applications, expected to impact global tech giants.',
    source: 'System Recovery',
    published_at: new Date(Date.now() - 172800000).toISOString(),
    tags: ['Regulation', 'EU', 'Policy'],
    slug: 'fallback-eu-ai-act'
  },
  {
    id: 'fallback-4',
    title: 'NVIDIA 發布新一代 AI 晶片架構 (System Fallback)',
    title_en: 'NVIDIA Unveils Next-Gen AI Chip Architecture',
    original_url: '#',
    summary_zh: '系統維護中。NVIDIA 推出代號為 Blackwell 的新架構，運算效能較前代提升數倍，將進一步推動 AI 模型訓練速度。',
    summary_en: 'System maintenance. NVIDIA introduces the Blackwell architecture, offering significantly higher performance than its predecessor, further boosting AI model training speeds.',
    source: 'System Recovery',
    published_at: new Date(Date.now() - 259200000).toISOString(),
    tags: ['Hardware', 'NVIDIA', 'Chips'],
    slug: 'fallback-nvidia-blackwell'
  },
  {
    id: 'fallback-5',
    title: '微軟整合 AI Copilot 至 Windows 12 (System Fallback)',
    title_en: 'Microsoft Integrates AI Copilot into Windows 12',
    original_url: '#',
    summary_zh: '系統維護中。傳聞 Windows 12 將深度整合 AI Copilot，改變使用者與作業系統的互動方式。',
    summary_en: 'System maintenance. Rumors suggest Windows 12 will deeply integrate AI Copilot, transforming how users interact with the operating system.',
    source: 'System Recovery',
    published_at: new Date(Date.now() - 345600000).toISOString(),
    tags: ['Microsoft', 'Windows', 'OS'],
    slug: 'fallback-microsoft-windows'
  }
];

async function getHotNews() {
  const { data: items } = await supabase
    .from('news_items')
    .select('id, title, original_url, summary_zh, summary_en, title_en, slug, published_at, source, tags, created_at')
    .order('published_at', { ascending: false })
    .limit(3);

  return items || [];
}

async function getLatestNews(): Promise<NewsItem[]> {
  const { data: items } = await supabase
    .from('news_items')
    .select('id, title, original_url, summary_zh, summary_en, title_en, slug, published_at, source, tags, created_at')
    .order('published_at', { ascending: false })
    .limit(50);

  if (!items || items.length === 0) {
    console.log('DB Connection failed or Empty. Using Fallback Data.');
    return FALLBACK_NEWS;
  }

  return items;
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
        <PinnedGuideCard />
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
