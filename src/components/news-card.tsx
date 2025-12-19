'use client';

import { NewsItem } from '@/types';
import { ExternalLink, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';
import { BookmarkButton } from './bookmark-button';
import { Skeleton } from './ui/skeleton';

interface NewsCardProps {
    news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
    const { language } = useLanguage();

    const date = new Date(news.published_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
    });

    const isTranslating = language === 'en' && !news.title_en;
    const displayTitle = (language === 'en' && news.title_en) ? news.title_en : news.title;
    const displaySummary = (language === 'en' && news.summary_en) ? news.summary_en : news.summary_zh;

    return (
        <article className={`relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group shadow-sm ${isTranslating ? 'animate-pulse' : ''}`}>
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <BookmarkButton
                    item={{
                        id: news.id,
                        title: news.title,
                        title_en: news.title_en,
                        summary: news.summary_zh || '',
                        summary_en: news.summary_en,
                        slug: news.slug || news.id,
                        published_at: news.published_at,
                        source: news.source,
                        original_url: news.original_url,
                        tags: news.tags || []
                    }}
                    size="sm"
                />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{news.source}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {date}
                </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link href={`/news/${news.slug || news.id}`} className="flex items-center gap-2 w-full">
                    {isTranslating ? (
                        <Skeleton className="h-7 w-3/4" />
                    ) : (
                        displayTitle
                    )}
                </Link>
            </h2>

            {isTranslating ? (
                <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            ) : displaySummary ? (
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {preprocessMarkdown(displaySummary)}
                </p>
            ) : null}

            {news.tags && news.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {news.tags.map((tag) => (
                        <a
                            key={tag}
                            href={`/tags/${encodeURIComponent(tag)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </a>
                    ))}
                </div>
            )}
        </article>
    );
}

