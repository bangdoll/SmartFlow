'use client';

import { NewsItem } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, Tag, ExternalLink, X, Share2 } from 'lucide-react';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTag, sortBy, initialItems]);

    const handleTagClick = (tag: string) => {
        if (selectedTag !== tag) {
            setSelectedTag(tag);
        }
    };

    const clearFilter = () => {
        setSelectedTag(null);
    };

    // State for read status
    const [readItems, setReadItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Load read items from localStorage
        const stored = localStorage.getItem('read_news');
        if (stored) {
            setReadItems(new Set(JSON.parse(stored)));
        }
    }, []);

    const markAsRead = (id?: string) => {
        if (!id) return;
        const newSet = new Set(readItems);
        newSet.add(id);
        setReadItems(newSet);
        localStorage.setItem('read_news', JSON.stringify(Array.from(newSet)));
    };

    const handleNewsClick = async (id?: string) => {
        if (!id) return;
        markAsRead(id); // Mark as read
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

    const handleShare = (item: NewsItem, platform: 'copy' | 'twitter' | 'facebook') => {
        const shareUrl = `${window.location.origin}/news/${item.id}`;
        const text = `[新趨勢] ${item.title}\n💡 ${item.summary_zh?.slice(0, 50)}...`;

        if (platform === 'copy') {
            navigator.clipboard.writeText(shareUrl);
            alert('連結已複製！'); // 簡單提示，實際專案可用 Toast
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
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
                            const isRead = item.id ? readItems.has(item.id) : false;

                            return (
                                <article
                                    key={item.id || item.original_url}
                                    className={`relative backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 shadow-sm group ${isRead
                                        ? 'bg-gray-50/40 dark:bg-gray-900/40 border-gray-200/50 dark:border-gray-800/30 opacity-80 hover:opacity-100'
                                        : 'bg-white/60 dark:bg-gray-900/60 border-white/50 dark:border-gray-800/50 hover:shadow-lg hover:scale-[1.01]'
                                        }`}
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
                                        <div className="flex items-center gap-3">
                                            {item.click_count && item.click_count > 0 && (
                                                <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                                    🔥 {item.click_count}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h2 className={`text-xl font-bold mb-3 leading-tight transition-colors ${isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                        }`}>
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
                                        <Link href={`/news/${item.id}`} className="block group/summary">
                                            <div className={`text-gray-600 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-line ${isRead ? 'text-gray-500 dark:text-gray-500' : ''} group-hover/summary:text-blue-600 dark:group-hover/summary:text-blue-400 transition-colors`}>
                                                {item.summary_zh}
                                            </div>
                                        </Link>
                                    )}

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags?.map((tag) => (
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

                                        {/* Share Buttons & Actions */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/news/${item.id}`}
                                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                            >
                                                <span className="text-lg">🤖</span>
                                                AI 導讀
                                            </Link>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleShare(item, 'copy')}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                    title="複製連結"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                                {/* X / Twitter (Simplified Icon or text) */}
                                                <button
                                                    onClick={() => handleShare(item, 'twitter')}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                                    title="分享到 X"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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

