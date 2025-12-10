'use client';

import { NewsItem } from '@/types';
import { useState, useMemo } from 'react';
import { ExternalLink, Calendar, Tag, X } from 'lucide-react';
import Link from 'next/link';

interface NewsFeedProps {
    items: NewsItem[];
}

export function NewsFeed({ items: initialItems }: NewsFeedProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [loadedItems, setLoadedItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter initial items based on tag
    const filteredInitialItems = useMemo(() => {
        if (!selectedTag) return initialItems;
        const normalizedTag = selectedTag.trim().toLowerCase();
        return initialItems.filter(item =>
            item.tags?.some(t => t.trim().toLowerCase() === normalizedTag)
        );
    }, [initialItems, selectedTag]);

    // Combine initial filtered items with loaded items
    const displayItems = useMemo(() => {
        return [...filteredInitialItems, ...loadedItems];
    }, [filteredInitialItems, loadedItems]);

    // Reset loaded items when tag changes
    const handleTagClick = (tag: string) => {
        if (selectedTag !== tag) {
            setSelectedTag(tag);
            setLoadedItems([]);
            setHasMore(true);
        }
    };

    const clearFilter = () => {
        setSelectedTag(null);
        setLoadedItems([]);
        setHasMore(true);
    };

    const loadMore = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const offset = displayItems.length;
            // Fetch next 10 items
            const params = new URLSearchParams({
                offset: offset.toString(),
                limit: '10'
            });

            if (selectedTag) {
                params.append('tag', selectedTag);
            }

            const res = await fetch(`/api/news?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load more news');

            const newItems: NewsItem[] = await res.json();

            if (newItems.length === 0) {
                setHasMore(false);
            } else {
                // Filter out duplicates just in case
                setLoadedItems(prev => {
                    const existingIds = new Set([...filteredInitialItems, ...prev].map(i => i.id));
                    const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));

                    if (uniqueNewItems.length === 0) setHasMore(false);

                    return [...prev, ...uniqueNewItems];
                });
            }
        } catch (error) {
            console.error('Error loading more news:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 篩選狀態顯示區 */}
            {selectedTag && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            篩選: <span className="text-blue-600 dark:text-blue-400">#{selectedTag}</span>
                        </h2>
                        <button
                            type="button"
                            onClick={clearFilter}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            清除
                        </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        目前顯示 {displayItems.length} 則相關新聞
                    </p>
                </div>
            )}

            {/* 新聞列表 */}
            {displayItems.length > 0 ? (
                <>
                    <div className="space-y-6">
                        {displayItems.map((item) => {
                            const date = new Date(item.published_at).toLocaleDateString('zh-TW', {
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                            return (
                                <article
                                    key={item.id || item.original_url}
                                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {date}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                        <Link
                                            href={item.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2"
                                        >
                                            {item.title}
                                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        </Link>
                                    </h2>

                                    {item.summary_zh && (
                                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-line">
                                            {item.summary_zh}
                                        </p>
                                    )}

                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {item.tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTagClick(tag)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${selectedTag === tag
                                                        ? 'bg-blue-500 text-white shadow-md scale-105'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400'
                                                        }`}
                                                >
                                                    <Tag className="w-3 h-3" />
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {/* Load More Button */}
                    <div className="mt-8 text-center">
                        {hasMore ? (
                            <button
                                onClick={loadMore}
                                disabled={isLoading}
                                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? '載入中...' : '載入更多新聞'}
                            </button>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                已顯示所有新聞
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {selectedTag
                        ? `沒有找到關於「${selectedTag}」的新聞。`
                        : '目前沒有新聞摘要。'
                    }
                </div>
            )}
        </div>
    );
}

