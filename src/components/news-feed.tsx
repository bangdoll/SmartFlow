'use client';

import { NewsItem } from '@/types';
import { useState, useMemo, useEffect } from 'react';
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
    const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

    // Filter initial items based on tag
    const filteredInitialItems = useMemo(() => {
        // 如果是按熱門排序，我們忽略 initialItems (因為它是 SSR 的最新新聞)，
        // 而是完全依賴客戶端載入 (因為 initialItems 沒有按熱門排序)
        // 這裡做一個簡單處理：如果是 popular，我們不使用 initialItems，除非它剛好也是 popular (但後端是按時間取)
        // 為了簡單起見，切換到 popular 時，我們完全依賴 fetch
        if (sortBy === 'popular') return [];

        if (!selectedTag) return initialItems;
        const normalizedTag = selectedTag.trim().toLowerCase();
        return initialItems.filter(item =>
            item.tags?.some(t => t.trim().toLowerCase() === normalizedTag)
        );
    }, [initialItems, selectedTag, sortBy]);

    // Combine initial filtered items with loaded items
    const displayItems = useMemo(() => {
        return [...filteredInitialItems, ...loadedItems];
    }, [filteredInitialItems, loadedItems]);

    // Reset loaded items when tag or sort changes
    useEffect(() => {
        setLoadedItems([]);
        setHasMore(true);
        // 如果切換到 popular，或者切換了 tag，我們需要重新載入
        // 因為 initialItems 只包含最新的，所以切換到 popular 時需要立即觸發載入
        if (sortBy === 'popular' || (selectedTag && loadedItems.length === 0)) {
            loadMore(true); // reset=true
        }
    }, [selectedTag, sortBy]);

    const handleTagClick = (tag: string) => {
        if (selectedTag !== tag) {
            setSelectedTag(tag);
        }
    };

    const clearFilter = () => {
        setSelectedTag(null);
    };

    const handleNewsClick = async (id?: string) => {
        if (!id) return;
        try {
            await fetch('/api/news/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch (e) {
            console.error('Failed to track click', e);
        }
    };

    const loadMore = async (reset = false) => {
        if ((isLoading && !reset) || (!hasMore && !reset)) return;

        setIsLoading(true);
        try {
            const offset = reset ? 0 : displayItems.length;

            const params = new URLSearchParams({
                offset: offset.toString(),
                limit: '10',
                sort: sortBy
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
                setLoadedItems(prev => {
                    if (reset) return newItems;

                    // Filter out duplicates
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
            {/* 控制列：篩選與排序 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {selectedTag ? (
                    <div className="p-2 px-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-full border border-blue-100 dark:border-blue-900/30 backdrop-blur-sm flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">篩選:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">#{selectedTag}</span>
                        <button
                            onClick={clearFilter}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        顯示最新 AI 趨勢
                    </div>
                )}

                {/* 排序切換 */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setSortBy('latest')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortBy === 'latest'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        最新發布
                    </button>
                    <button
                        onClick={() => setSortBy('popular')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortBy === 'popular'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        🔥 熱門點擊
                    </button>
                </div>
            </div>

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
                                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 shadow-sm group"
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
                                        {item.click_count && item.click_count > 0 && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                                🔥 {item.click_count}
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                        <Link
                                            href={item.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleNewsClick(item.id)}
                                            className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2 group-hover:underline decoration-blue-500/30 underline-offset-4"
                                        >
                                            {item.title}
                                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                onClick={() => loadMore(false)}
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
                    {isLoading ? '載入中...' : selectedTag
                        ? `沒有找到關於「${selectedTag}」的新聞。`
                        : '目前沒有新聞摘要。'
                    }
                </div>
            )}
        </div>
    );
}

