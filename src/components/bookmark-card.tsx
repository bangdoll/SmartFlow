'use client';

import { BookmarkItem, useBookmarks } from '@/hooks/use-bookmarks';
import { ExternalLink, Calendar, Tag, Trash2 } from 'lucide-react';
import Link from 'next/link';
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

    return (
        <article className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full">
            {/* 
              PRIMARY INTERACTION: Stretched Link 
              This makes the entire card clickable by covering it with an absolute link.
            */}
            <Link
                href={`/news/${item.slug || item.id}`}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label={`Read ${displayTitle}`}
            />

            {/* Remove Button - Top Right (Must be z-20 to sit ABOVE the stretched link) */}
            <button
                onClick={(e) => {
                    // Prevent default to avoid following the link underneath if event bubbles (though z-index usually handles click target)
                    // But safe to stop propagation just in case.
                    e.preventDefault();
                    e.stopPropagation();
                    removeBookmark(item.id);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-20 group/btn bg-white/50 dark:bg-black/50 backdrop-blur-sm"
                title={language === 'en' ? 'Remove bookmark' : '移除收藏'}
            >
                <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            </button>

            {/* Meta Row */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 pr-8 relative z-0">
                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                    {item.source}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {date}
                </span>
            </div>

            {/* Title (Visual only, click handled by stretched link) */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 relative z-0">
                {displayTitle}
            </h2>

            {/* Summary - Clamped */}
            <div className="flex-grow mb-4 relative z-0">
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                    {preprocessMarkdown(displaySummary || '')}
                </div>
            </div>

            {/* Footer: Tags & Read More */}
            <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 relative z-0">
                <div className="flex flex-wrap gap-1.5 flex-1 mr-4 h-6 overflow-hidden">
                    {item.tags && item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            # {tag}
                        </span>
                    ))}
                </div>

                <div className="flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                    {language === 'en' ? 'Read More' : '閱讀全文'}
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </article>
    );
}
