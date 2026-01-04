'use client';

import { useLanguage } from '@/components/language-context';
import { TrendingUp, TrendingDown, Minus, Calendar, ExternalLink, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface TopicData {
    name: string;
    totalNews: number;
    recentNews: number;
    latestNews: Array<{
        id: string;
        title: string;
        title_en?: string | null;
        published_at: string;
        source: string;
        slug?: string;
    }>;
    firstMention: string | null;
}

interface CompareViewProps {
    data: {
        topic1: TopicData;
        topic2: TopicData;
    };
}

export function CompareView({ data }: CompareViewProps) {
    const { language } = useLanguage();
    const { topic1, topic2 } = data;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // 計算勝負
    const winner = topic1.recentNews > topic2.recentNews ? 1 : topic1.recentNews < topic2.recentNews ? 2 : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    <span className="text-blue-600">{topic1.name}</span>
                    <span className="mx-3 text-gray-400">vs</span>
                    <span className="text-purple-600">{topic2.name}</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {language === 'en'
                        ? 'AI News Coverage Comparison 2025'
                        : '2025 AI 新聞報導比較分析'
                    }
                </p>
            </div>

            {/* Stats Comparison */}
            <div className="grid grid-cols-3 gap-4">
                {/* Topic 1 Stats */}
                <div className="text-center">
                    <div className={`text-3xl font-bold ${winner === 1 ? 'text-green-500' : 'text-blue-600'}`}>
                        {topic1.totalNews}
                    </div>
                    <div className="text-sm text-gray-500">
                        {language === 'en' ? 'Total Articles' : '總報導數'}
                    </div>
                </div>

                {/* VS Badge */}
                <div className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BarChart2 className="w-6 h-6 text-gray-400" />
                    </div>
                </div>

                {/* Topic 2 Stats */}
                <div className="text-center">
                    <div className={`text-3xl font-bold ${winner === 2 ? 'text-green-500' : 'text-purple-600'}`}>
                        {topic2.totalNews}
                    </div>
                    <div className="text-sm text-gray-500">
                        {language === 'en' ? 'Total Articles' : '總報導數'}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                    {language === 'en' ? 'Recent 30 Days Activity' : '近 30 天熱度比較'}
                </h2>
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-blue-600">{topic1.recentNews}</span>
                            {winner === 1 && <TrendingUp className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="text-sm text-gray-500">{topic1.name}</div>
                    </div>

                    <div className="px-4 text-gray-400">vs</div>

                    <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-purple-600">{topic2.recentNews}</span>
                            {winner === 2 && <TrendingUp className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="text-sm text-gray-500">{topic2.name}</div>
                    </div>
                </div>

                {/* Winner Badge */}
                {winner !== 0 && (
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                            🏆 {winner === 1 ? topic1.name : topic2.name}
                            {language === 'en' ? ' is trending higher' : ' 近期聲量較高'}
                        </span>
                    </div>
                )}
            </div>

            {/* Side by Side News */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Topic 1 News */}
                <div>
                    <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600" />
                        {topic1.name} {language === 'en' ? 'Latest News' : '最新動態'}
                    </h3>
                    <div className="space-y-3">
                        {topic1.latestNews.length > 0 ? (
                            topic1.latestNews.map(news => (
                                <Link
                                    key={news.id}
                                    href={`/news/${news.slug || news.id}`}
                                    className="block p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(news.published_at)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                        {(language === 'en' && news.title_en) ? news.title_en : news.title}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                {language === 'en' ? 'No news found' : '尚無相關新聞'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Topic 2 News */}
                <div>
                    <h3 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600" />
                        {topic2.name} {language === 'en' ? 'Latest News' : '最新動態'}
                    </h3>
                    <div className="space-y-3">
                        {topic2.latestNews.length > 0 ? (
                            topic2.latestNews.map(news => (
                                <Link
                                    key={news.id}
                                    href={`/news/${news.slug || news.id}`}
                                    className="block p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(news.published_at)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                        {(language === 'en' && news.title_en) ? news.title_en : news.title}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                {language === 'en' ? 'No news found' : '尚無相關新聞'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SEO Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2>{topic1.name} vs {topic2.name}: {language === 'en' ? 'Analysis' : '深度比較分析'}</h2>
                <p>
                    {language === 'en'
                        ? `Based on our AI news database, ${topic1.name} has ${topic1.totalNews} articles while ${topic2.name} has ${topic2.totalNews} articles in total. In the recent 30 days, ${winner === 1 ? topic1.name : winner === 2 ? topic2.name : 'both topics'} shows higher activity.`
                        : `根據我們的 AI 新聞資料庫，${topic1.name} 累計有 ${topic1.totalNews} 則報導，${topic2.name} 則有 ${topic2.totalNews} 則。近 30 天內，${winner === 1 ? topic1.name : winner === 2 ? topic2.name : '兩者'} 的討論熱度較高。`
                    }
                </p>
            </div>

            {/* Other Comparisons */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {language === 'en' ? 'Other Popular Comparisons' : '其他熱門比較'}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        ['GPT-5.2', 'Gemini 3'],
                        ['Claude 4.5', 'GPT-5.2'],
                        ['Midjourney v7', 'Flux 2'],
                        ['Sora 2', 'Runway Gen-4'],
                    ].map(([t1, t2]) => (
                        <Link
                            key={`${t1}-${t2}`}
                            href={`/compare/${t1.toLowerCase()}-vs-${t2.toLowerCase()}`}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            {t1} vs {t2}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
