'use client';

import { NewsItem } from '@/types';
import { ExternalLink, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';

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

    const displayTitle = (language === 'en' && news.title_en) ? news.title_en : news.title;
    const displaySummary = (language === 'en' && news.summary_en) ? news.summary_en : news.summary_zh;

    return (
        <article className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{news.source}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {date}
                </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link href={`/news/${news.slug || news.id}`} className="flex items-center gap-2">
                    {language === 'en' && !news.title_en ? (
                        <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-3/4 rounded block"></span>
                    ) : (
                        displayTitle
                    )}
                </Link>
            </h2>

            {displaySummary && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {preprocessMarkdown(displaySummary)}
                </p>
            )}

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

