'use client';

import { NewsItem } from '@/types';
import { useLanguage } from './language-context';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface SearchResultsListProps {
    items: NewsItem[];
    query: string;
}

import { useBatchTranslation } from '@/hooks/use-batch-translation';
import { preprocessMarkdown } from '@/lib/markdown';

export function SearchResultsList({ items: initialItems, query }: SearchResultsListProps) {
    const { t, language } = useLanguage();
    const items = useBatchTranslation(initialItems);

    return (
        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'en' ? 'Search Results: ' : '搜尋結果: '}
                    <span className="text-blue-600">{query}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {language === 'en'
                        ? `Found ${items.length} articles`
                        : `找到 ${items.length} 篇相關文章`}
                </p>
            </div>

            <div className="space-y-6">
                {items.length > 0 ? (
                    items.map((item) => {
                        const date = new Date(item.published_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'Asia/Taipei',
                        });

                        const showEn = language === 'en';
                        const hasEn = !!item.title_en;

                        // Strict Mode Skeleton
                        if (showEn && !hasEn) {
                            return (
                                <article
                                    key={item.id}
                                    className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 animate-pulse"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    </div>
                                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    </div>
                                    <div className="mt-4 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                                        Translating...
                                    </div>
                                </article>
                            );
                        }

                        const displayTitle = (language === 'en' && item.title_en) ? item.title_en : item.title;
                        const displaySummary = (language === 'en' && item.summary_en) ? item.summary_en : (item.summary_zh || item.summary_en);

                        return (
                            <article
                                key={item.id}
                                className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {date}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    <Link href={`/news/${item.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        {displayTitle}
                                    </Link>
                                </h2>

                                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                                    {preprocessMarkdown(displaySummary || null)}
                                </p>

                                {item.tags && (
                                    <div className="flex flex-wrap gap-2">
                                        {(item.tags as string[]).map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </article>
                        )
                    })
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        {t('search.noResults')}
                    </div>
                )}
            </div>
        </div>
    );
}
