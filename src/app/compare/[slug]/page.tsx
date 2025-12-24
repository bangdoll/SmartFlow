import { supabase } from '@/lib/supabase';
import { CompareView } from '@/components/compare-view';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// 熱門比較組合 - 用於 generateStaticParams
const POPULAR_COMPARISONS = [
    ['OpenAI', 'Anthropic'],
    ['ChatGPT', 'Claude'],
    ['GPT-4', 'Gemini'],
    ['Midjourney', 'DALL-E'],
    ['Meta', 'Google'],
    ['Microsoft', 'Google'],
    ['Sora', 'Runway'],
    ['台積電', 'NVIDIA'],
];

interface Props {
    params: Promise<{ slug: string }>;
}

// 解析 slug (例如 "openai-vs-anthropic")
function parseSlug(slug: string) {
    const parts = slug.split('-vs-');
    if (parts.length !== 2) return null;
    return {
        topic1: decodeURIComponent(parts[0]).replace(/-/g, ' '),
        topic2: decodeURIComponent(parts[1]).replace(/-/g, ' '),
    };
}

// 獲取主題相關新聞
async function getTopicNews(topic: string, limit = 20) {
    const { data, error } = await supabase
        .from('news_items')
        .select('id, title, title_en, summary_zh, published_at, source, slug, tags')
        .or(`title.ilike.%${topic}%,summary_zh.ilike.%${topic}%,tags.cs.{${topic}}`)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error(`Error fetching news for ${topic}:`, error);
        return [];
    }

    return data || [];
}

// 生成比較資料
async function getComparisonData(topic1: string, topic2: string) {
    const [news1, news2] = await Promise.all([
        getTopicNews(topic1),
        getTopicNews(topic2),
    ]);

    // 計算熱度（最近 30 天新聞數量）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNews1 = news1.filter(n => new Date(n.published_at) > thirtyDaysAgo);
    const recentNews2 = news2.filter(n => new Date(n.published_at) > thirtyDaysAgo);

    return {
        topic1: {
            name: topic1,
            totalNews: news1.length,
            recentNews: recentNews1.length,
            latestNews: news1.slice(0, 5),
            firstMention: news1.length > 0 ? news1[news1.length - 1].published_at : null,
        },
        topic2: {
            name: topic2,
            totalNews: news2.length,
            recentNews: recentNews2.length,
            latestNews: news2.slice(0, 5),
            firstMention: news2.length > 0 ? news2[news2.length - 1].published_at : null,
        },
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSlug(slug);

    if (!parsed) {
        return { title: 'Comparison Not Found' };
    }

    const { topic1, topic2 } = parsed;
    const title = `${topic1} vs ${topic2} 比較分析 | 2025 AI 趨勢`;
    const description = `深入比較 ${topic1} 和 ${topic2} 的最新發展、新聞報導和市場動態。了解兩者在 AI 領域的定位與差異。`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
        },
        keywords: [topic1, topic2, 'AI 比較', '人工智慧', '科技趨勢', '2025'],
    };
}

export async function generateStaticParams() {
    return POPULAR_COMPARISONS.map(([t1, t2]) => ({
        slug: `${t1.toLowerCase().replace(/\s+/g, '-')}-vs-${t2.toLowerCase().replace(/\s+/g, '-')}`,
    }));
}

export const revalidate = 3600; // 1 小時重新驗證

export default async function ComparePage({ params }: Props) {
    const { slug } = await params;
    const parsed = parseSlug(slug);

    if (!parsed) {
        notFound();
    }

    const { topic1, topic2 } = parsed;
    const data = await getComparisonData(topic1, topic2);

    // 如果兩個主題都沒有新聞，顯示 404
    if (data.topic1.totalNews === 0 && data.topic2.totalNews === 0) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <CompareView data={data} />
        </div>
    );
}
