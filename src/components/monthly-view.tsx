'use client';

import { NewsItem } from '@/types';
import { useLanguage } from '@/components/language-context';
import { Calendar, TrendingUp, Clock, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { preprocessMarkdown } from '@/lib/markdown';

interface TrendItem {
    topic: string;
    count: number;
}

interface WeeklyGroup {
    weekStart: string;
    items: NewsItem[];
}

interface MonthlyViewProps {
    newsItems: NewsItem[];
    trends: TrendItem[];
    weeklyGroups: WeeklyGroup[];
}

export function MonthlyView({ newsItems, trends, weeklyGroups }: MonthlyViewProps) {
    const { t, language } = useLanguage();
    const [expandedWeek, setExpandedWeek] = useState<string | null>(weeklyGroups[0]?.weekStart || null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatWeekRange = (weekStart: string) => {
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
    };

    // 計算日期範圍
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('monthly.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {t('monthly.subtitle')}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    {formatDate(thirtyDaysAgo.toISOString())} - {formatDate(now.toISOString())}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{newsItems.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('monthly.totalNews')}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weeklyGroups.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('monthly.weeks')}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{trends.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('monthly.topics')}</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.round(newsItems.length / 30)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('monthly.dailyAvg')}</div>
                </div>
            </div>

            {/* Top Trends */}
            {trends.length > 0 && (
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-5 h-5 text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('monthly.topKeywords')}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trends.map((trend, index) => (
                            <Link
                                key={trend.topic}
                                href={`/tags/${encodeURIComponent(trend.topic)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                            >
                                <span className="text-xs text-purple-500">#{index + 1}</span>
                                {trend.topic}
                                <span className="text-xs text-purple-400">({trend.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Weekly Timeline */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('monthly.weeklyBreakdown')}
                    </h2>
                </div>

                <div className="space-y-4">
                    {weeklyGroups.map((week) => (
                        <div
                            key={week.weekStart}
                            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedWeek(
                                    expandedWeek === week.weekStart ? null : week.weekStart
                                )}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            {week.items.length}
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {formatWeekRange(week.weekStart)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {week.items.length} {language === 'en' ? 'articles' : '則新聞'}
                                        </div>
                                    </div>
                                </div>
                                {expandedWeek === week.weekStart ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {expandedWeek === week.weekStart && (
                                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                                    {week.items.map((item) => {
                                        const displayTitle = (language === 'en' && item.title_en) ? item.title_en : item.title;

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/news/${item.slug || item.id}`}
                                                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.source}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(item.published_at)}</span>
                                                </div>
                                                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                                    {displayTitle}
                                                </h3>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
