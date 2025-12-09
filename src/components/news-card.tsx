'use client';

import { NewsItem } from '@/types';
import { ExternalLink, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { useTagFilter } from './tag-filter-context';

interface NewsCardProps {
    news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
    const { setSelectedTag } = useTagFilter();

    const date = new Date(news.published_at).toLocaleDateString('zh-TW', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

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

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                <Link href={news.original_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                    {news.title}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
            </h2>

            {news.summary_zh && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {news.summary_zh}
                </p>
            )}

            {news.tags && news.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {news.tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}

