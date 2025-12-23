'use client';

import { NewsItem } from '@/types';
import { useLanguage } from '@/components/language-context';
import { Calendar, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { preprocessMarkdown } from '@/lib/markdown';

interface WeeklyTrendsData {
    title: string;
    core_message: string;
    trends: Array<{ topic: string; count: number; sentiment?: string }>;
    persona_advice: Record<string, string>;
    week_start_date: string;
    week_end_date: string;
}

interface WeeklyViewProps {
    newsItems: NewsItem[];
    trendsData: WeeklyTrendsData | null;
}

export function WeeklyView({ newsItems, trendsData }: WeeklyViewProps) {
    const { t, language } = useLanguage();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 計算日期範圍
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('weekly.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {t('weekly.subtitle')}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    {t('weekly.dateRange')}: {formatDate(sevenDaysAgo.toISOString())} - {formatDate(now.toISOString())}
                </div>
            </div>

            {/* Risk Summary from Weekly Trends */}
            {trendsData && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('weekly.riskSummary')}
                        </h2>
                    </div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                        {trendsData.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {trendsData.core_message}
                    </p>

                    {/* Persona Advice */}
                    {trendsData.persona_advice && Object.keys(trendsData.persona_advice).length > 0 && (
                        <div className="mt-6 pt-4 border-t border-red-200 dark:border-red-800/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {language === 'en' ? 'Advice by Role' : '角色建議'}
                                </span>
                            </div>
                            <div className="grid gap-3">
                                {Object.entries(trendsData.persona_advice).slice(0, 3).map(([persona, advice]) => (
                                    <div key={persona} className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {persona}:
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                            {advice}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top Trends */}
            {trendsData?.trends && trendsData.trends.length > 0 && (
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {language === 'en' ? 'Top Keywords' : '本週熱門關鍵字'}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendsData.trends.slice(0, 10).map((trend, index) => (
                            <Link
                                key={trend.topic}
                                href={`/tags/${encodeURIComponent(trend.topic)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <span className="text-xs text-blue-500">#{index + 1}</span>
                                {trend.topic}
                                <span className="text-xs text-blue-400">({trend.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* News List */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('weekly.topNews')}
                    </h2>
                    <span className="text-sm text-gray-500">({newsItems.length})</span>
                </div>

                {newsItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        {t('weekly.noData')}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {newsItems.map((item) => {
                            const displayTitle = (language === 'en' && item.title_en) ? item.title_en : item.title;
                            const displaySummary = (language === 'en' && item.summary_en) ? item.summary_en : item.summary_zh;

                            return (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.slug || item.id}`}
                                    className="block bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{item.source}</span>
                                        <span>•</span>
                                        <span>{formatDate(item.published_at)}</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {displayTitle}
                                    </h3>
                                    {displaySummary && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {preprocessMarkdown(displaySummary)}
                                        </p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
