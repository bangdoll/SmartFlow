'use client';

import { NewsItem } from '@/types';
import { NewsCard } from './news-card';
import { useTagFilter } from './tag-filter-context';
import { useMemo } from 'react';

interface NewsFeedProps {
    items: NewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
    const { selectedTag, setSelectedTag } = useTagFilter();

    const filteredItems = useMemo(() => {
        if (!selectedTag) return items;
        const normalizedTag = selectedTag.trim().toLowerCase();
        return items.filter(item =>
            item.tags?.some(t => t.trim().toLowerCase() === normalizedTag)
        );
    }, [items, selectedTag]);

    return (
        <div className="space-y-6">
            {/* 篩選狀態顯示區 */}
            {selectedTag && (
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Tag: <span className="text-blue-600 dark:text-blue-400">#{selectedTag}</span>
                        </h2>
                        <button
                            onClick={() => setSelectedTag(null)}
                            className="text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors shadow-sm cursor-pointer"
                        >
                            清除篩選 ✕
                        </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        顯示關於 "{selectedTag}" 的精選新聞 ({filteredItems.length} 則)
                    </p>
                </div>
            )}

            {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                    <NewsCard key={item.id || item.original_url} news={item} />
                ))
            ) : (
                <div className="text-center py-12 text-gray-500 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {selectedTag ? `目前沒有關於 "${selectedTag}" 的新聞摘要。` : '目前沒有新聞摘要。'}
                </div>
            )}
        </div>
    );
}

