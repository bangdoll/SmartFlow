import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { Zap, TrendingUp, Hash } from 'lucide-react';
import Link from 'next/link';

async function getTrends() {
    // 雖然有 API，但在 Server Component 直接呼叫 DB 更快且不需 fetch localhost
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: items } = await supabase
        .from('news_items')
        .select('tags')
        .gte('published_at', sevenDaysAgo.toISOString());

    const tagCounts: Record<string, number> = {};
    items?.forEach(item => {
        const tags = item.tags as string[] | null;
        tags?.forEach((tag: string) => {
            const normalizedTag = tag.trim();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

export default async function TrendsPage() {
    const trends = await getTrends();

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Header />

            <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        每週關鍵字趨勢
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        過去 7 天 AI 領域最熱門的話題排行
                    </p>
                </div>

                <div className="grid gap-4">
                    {trends.map((item, index) => (
                        <Link
                            key={item.tag}
                            href={`/archive?tag=${encodeURIComponent(item.tag)}`}
                            className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between hover:scale-[1.02] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${index < 3
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {item.tag}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                <Zap className="w-4 h-4 text-blue-500" />
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {item.count}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">則新聞</span>
                            </div>
                        </Link>
                    ))}

                    {trends.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            目前沒有足夠的數據來顯示趨勢。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
