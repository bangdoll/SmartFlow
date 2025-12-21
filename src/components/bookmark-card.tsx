'use client';

import { BookmarkItem, useBookmarks } from '@/hooks/use-bookmarks';
import { ExternalLink, Calendar, Tag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';

interface BookmarkCardProps {
    item: BookmarkItem;
}

export function BookmarkCard({ item }: BookmarkCardProps) {
    const { language } = useLanguage();
    const { removeBookmark } = useBookmarks();

    const date = new Date(item.published_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const displayTitle = (language === 'en' && item.title_en) ? item.title_en : item.title;
    const displaySummary = (language === 'en' && item.summary_en) ? item.summary_en : item.summary;
    const linkHref = `/news/${item.slug || item.id}`;

    // Use window.location.href for hard navigation (same as NewsFeed.handleCardClick)
    const handleCardClick = () => {
        window.location.href = linkHref;
    };

    return (
        <article
            onClick={handleCardClick}
            className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group shadow-sm cursor-pointer"
        >
            {/* Remove Button - Top Right, z-10 to sit above card */}
            <div
                className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeBookmark(item.id);
                    }}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-sm"
                    title={language === 'en' ? 'Remove bookmark' : '移除收藏'}
                >
                    <Trash2 className="w-5 h-5 hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {date}
                </span>
            </div>

            {/* Title with Link - Follows NewsCard pattern */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link href={linkHref} className="flex items-center gap-2 w-full">
                    {displayTitle}
                </Link>
            </h2>

            {/* Summary */}
            {displaySummary && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-4">
                    {preprocessMarkdown(displaySummary)}
                </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </article>
    );
}
