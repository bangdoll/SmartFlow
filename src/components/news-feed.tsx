'use client';

import { NewsItem } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, Tag, ExternalLink, X, Share2 } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';

interface NewsFeedProps {
    items: NewsItem[];
}

export function NewsFeed({ items: initialItems }: NewsFeedProps) {
    const { t, language } = useLanguage();
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Store all items in state to allow prepending new ones on refresh
    const [feedItems, setFeedItems] = useState<NewsItem[]>(initialItems);

    const [loadedItems, setLoadedItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());


    // Pull to Refresh State
    const [isPulling, setIsPulling] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullThreshold = 100; // Pixels to pull to trigger refresh

    useEffect(() => {
        setFeedItems(initialItems);
    }, [initialItems]);

    // Touch Event Handlers for Pull to Refresh
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                setStartY(e.touches[0].clientY);
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling) return;
            const y = e.touches[0].clientY;
            const diff = y - startY;
            if (diff > 0 && window.scrollY === 0) {
                // Prevent default pull-to-refresh on some browsers if we want custom
                // e.preventDefault(); // Optional: might block scrolling if not careful
                setCurrentY(diff);
            } else {
                setIsPulling(false);
                setCurrentY(0);
            }
        };

        const handleTouchEnd = async () => {
            if (isPulling && currentY > pullThreshold && !isRefreshing) {
                await handleRefresh();
            }
            setIsPulling(false);
            setCurrentY(0);
        };

        // Only attach if on mobile/touch device
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, startY, currentY, isRefreshing]);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // 1. Try to trigger a manual scrape first
            setToast({ message: '正在檢查最新新聞...', type: 'info' });

            // Call the manual trigger endpoint
            const triggerRes = await fetch('/api/cron/manual-trigger', { method: 'POST' });
            const triggerData = await triggerRes.json();

            // Even if rate limited (success: false), we proceed to fetch items 
            // because there might be new items from other sources or just standard delay

            if (triggerData.success) {
                setToast({ message: '分析完成，正在獲取新聞...', type: 'info' });
            } else {
                // Rate limited or error, silent log
                console.log('Manual trigger skipped:', triggerData.message);
            }

            // 2. Fetch latest 3 items from DB
            const res = await fetch('/api/news?limit=3&offset=0');
            if (res.ok) {
                const newItems: NewsItem[] = await res.json();

                setFeedItems(prev => {
                    // Filter out duplicates based on ID
                    const existingIds = new Set(prev.map(i => i.id));
                    const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));

                    if (uniqueNewItems.length > 0) {
                        setToast({ message: `已更新 ${uniqueNewItems.length} 則新聞！`, type: 'success' });
                        return [...uniqueNewItems, ...prev];
                    } else {
                        // If we just ran a scraper and found nothing new
                        if (triggerData.success) {
                            setToast({ message: '目前沒有新新聞', type: 'info' });
                        } else {
                            setToast({ message: '目前已是最新狀態', type: 'info' });
                        }
                        return prev;
                    }
                });
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            setToast({ message: '更新失敗，請稍後再試', type: 'info' });
        } finally {
            // Wait a bit to show the animation finish
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Filter logic
    const displayItems = useMemo(() => {
        let baseItems = sortBy === 'popular' ? [] : feedItems;

        // If sorting by popular, we rely on loadMore to fetch popular items.
        // If sorting by latest, we use feedItems (which includes initial + refreshed) + loadedItems (from loadMore)

        let combined = [...baseItems, ...loadedItems];

        // Deduplicate just in case
        const seen = new Set();
        combined = combined.filter(item => {
            const dup = seen.has(item.id);
            seen.add(item.id);
            return !dup;
        });

        if (sortBy === 'popular') return combined; // Popular items are handled by loadedItems mostly

        if (!selectedTag) return combined;

        const normalizedTag = selectedTag.trim().toLowerCase();
        return combined.filter(item =>
            item.tags?.some(t => t.trim().toLowerCase() === normalizedTag)
        );
    }, [feedItems, loadedItems, selectedTag, sortBy]);

    // Reset loaded items when tag or sort changes
    useEffect(() => {
        setLoadedItems([]);
        setHasMore(true);
        // 如果切換到 popular，或者切換了 tag，我們需要重新載入
        if (sortBy === 'popular' || (selectedTag && loadedItems.length === 0)) {
            loadMore(true); // reset=true
        }
    }, [selectedTag, sortBy]); // Removed initialItems from dep to avoid loop

    // Batch Translation Logic (Moved here to access displayItems)
    useEffect(() => {
        if (language !== 'en') {
            setTranslatingIds(new Set());
            return;
        }

        const itemsToTranslate = displayItems.filter(
            item => !item.title_en && !translatingIds.has(item.id)
        );

        if (itemsToTranslate.length === 0) return;

        const ids = itemsToTranslate.map(i => i.id);

        // Optimistically mark as translating
        setTranslatingIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });

        // Call Batch API
        // Debounce? No, just call it.
        fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    const updateList = (list: NewsItem[]) => list.map(item => {
                        const updated = data.results.find((u: any) => u.id === item.id);
                        if (updated) {
                            return { ...item, title_en: updated.title_en, summary_en: updated.summary_en };
                        }
                        return item;
                    });
                    setFeedItems(prev => updateList(prev));
                    setLoadedItems(prev => updateList(prev));
                }
            })
            .catch(err => console.error('Batch translate error:', err))
            .finally(() => {
                setTranslatingIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            });

    }, [language, displayItems, translatingIds]);

    const loadMore = async (reset = false) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // If we have refreshed items (prepended), the offset calculation changes.
            // But easiest way is just rely on list length.
            const currentCount = reset ? 0 : displayItems.length;
            const params = new URLSearchParams({
                offset: currentCount.toString(),
                limit: '10',
            });

            if (selectedTag) {
                params.append('tag', selectedTag);
            }
            if (sortBy === 'popular') {
                params.append('sort', 'popular');
            }

            const res = await fetch(`/api/news?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load news');

            const newItems: NewsItem[] = await res.json();

            if (newItems.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (reset) {
                setLoadedItems(newItems);
            } else {
                // We need to be careful not to add duplicates if they are already in feedItems
                setLoadedItems(prev => [...prev, ...newItems]);
            }
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
        const shareUrl = `${window.location.origin}/news/${item.slug || item.id}`;
        const text = `[新趨勢] ${item.title}`;

        if (platform === 'copy') {
            const copyText = `${text} ${shareUrl}`;
            navigator.clipboard.writeText(copyText);
            setToast({ message: '連結已複製！', type: 'success' });
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Pull to Refresh Indicator */}
            <div
                className="fixed top-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-none"
                style={{
                    opacity: (currentY > 0 || isRefreshing) ? 1 : 0,
                    transform: `translateX(-50%) translateY(${isRefreshing ? 20 : Math.min(currentY * 0.5, 50)}px)`
                }}
            >
                <div className="bg-white dark:bg-gray-800 text-blue-600 rounded-full p-2 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className={`w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ transform: !isRefreshing ? `rotate(${currentY * 3}deg)` : undefined }}
                    />
                </div>
            </div>

            {/* Toast Notification */}
            <div
                className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
            >
                <div className={`px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white ${toast?.type === 'success' ? 'bg-green-500' : 'bg-gray-800/90 backdrop-blur-md'}`}>
                    {toast?.message}
                </div>
            </div>

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
                        {t('home.showLatest')}
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
                        {t('home.sortLatest')}
                    </button>
                    <button
                        onClick={() => setSortBy('popular')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${sortBy === 'popular'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        🔥 {t('home.sortPopular')}
                    </button>
                </div>
            </div>

            {/* 新聞列表標題 */}
            <div className="mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('home.latest')}</h2>
            </div>

            {/* 新聞列表 */}
            {displayItems.length > 0 ? (
                <>
                    <div className="space-y-6">
                        {displayItems.map((item) => {
                            const date = new Date(item.published_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Taipei',
                            });
                            const isRead = item.id ? readItems.has(item.id) : false;

                            // Bilingual logic with Strict Mode
                            const showEn = language === 'en';
                            const hasEn = !!item.title_en;
                            const isTranslatingItem = translatingIds.has(item.id);

                            // Display Data
                            const displayTitle = showEn
                                ? (item.title_en || 'Translating title...')
                                : item.title;

                            const displaySummary = showEn
                                ? (item.summary_en || 'Translating summary...')
                                : item.summary_zh;

                            // Strict Mode Block: If EN requested but missing, show Loading state
                            if (showEn && !hasEn) {
                                return (
                                    <article
                                        key={item.id || item.original_url}
                                        className="relative backdrop-blur-sm border rounded-xl p-6 bg-white/40 dark:bg-gray-900/40 border-white/50 dark:border-gray-800/50 animate-pulse"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        {/* Optional: translating label */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-medium bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-full shadow-sm border border-blue-100 dark:border-blue-900">
                                            Translating...
                                        </div>
                                    </article>
                                );
                            }

                            return (
                                <article
                                    key={item.id || item.original_url}
                                    className={`relative backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 shadow-sm group ${isRead
                                        ? 'bg-gray-50/40 dark:bg-gray-900/40 border-gray-200/50 dark:border-gray-800/30 opacity-80 hover:opacity-100'
                                        : 'bg-white/60 dark:bg-gray-900/60 border-white/50 dark:border-gray-800/50 hover:shadow-lg hover:scale-[1.01]'
                                        }`}
                                >
                                    {/* Helper Link to make whole card clickable */}
                                    <Link
                                        href={`/news/${item.slug || item.id}`}
                                        onClick={() => handleNewsClick(item.id)}
                                        className="absolute inset-0 z-0"
                                        aria-label={`Read more about ${displayTitle}`}
                                    />

                                    <div className="relative z-10 pointer-events-none">
                                        {/* Header Row */}
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

                                        {/* Title (Text Only, Click handled by Card) */}
                                        <h2 className={`text-xl font-bold mb-3 leading-tight transition-colors ${isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                            }`}>
                                            {displayTitle}
                                        </h2>

                                        {/* Summary (Text Only) */}
                                        {displaySummary && (
                                            <div className={`text-gray-600 dark:text-gray-300 mb-4 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-table:border-collapse prose-th:bg-blue-50 dark:prose-th:bg-blue-900/30 prose-th:p-2 prose-td:p-2 prose-th:text-left prose-table:w-full prose-table:text-sm ${isRead ? 'text-gray-500 dark:text-gray-500' : ''} group-hover:text-blue-600/80 dark:group-hover:text-blue-400/80 transition-colors`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{preprocessMarkdown(displaySummary)}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions (Must be clickable, so z-20 and pointer-events-auto) */}
                                    <div className="relative z-20 flex items-center justify-between mt-4 pointer-events-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags?.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card click
                                                        handleTagClick(tag);
                                                    }}
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
                                            {/* We can keep AI Guide button as a separate distinct action if we want, even if card goes there too. 
                                                But maybe redundant? Let's keep it for visual cue. */}
                                            <Link
                                                href={`/news/${item.slug || item.id}`}
                                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-lg">🤖</span>
                                                {t('feed.aiGuide')}
                                            </Link>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(item, 'copy');
                                                    }}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                    title="複製連結"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(item, 'twitter');
                                                    }}
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

                    {/* Infinite Scroll Sentinel */}
                    <div
                        ref={(node) => {
                            if (!node || isLoading || !hasMore) return;
                            const observer = new IntersectionObserver((entries) => {
                                if (entries[0].isIntersecting) {
                                    loadMore(false);
                                }
                            }, { threshold: 0.1, rootMargin: '100px' });
                            observer.observe(node);
                            return () => observer.disconnect();
                        }}
                        className="mt-8 text-center py-8"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>{t('home.loading')}...</span>
                            </div>
                        ) : hasMore ? (
                            <span className="text-gray-400 text-sm">滑動載入更多...</span>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {t('home.noMore')}
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

