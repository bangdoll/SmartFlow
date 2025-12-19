'use client';

import { useBookmarks } from '@/hooks/use-bookmarks';
import { BookmarkCard } from '@/components/bookmark-card';
import { Bookmark, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function BookmarksPage() {
    const { bookmarks } = useBookmarks();

    if (bookmarks.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Bookmark className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    還沒有收藏任何文章
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                    看到感興趣的新聞時，點擊右上角的書籤圖示，就可以在這裡隨時回顧。
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                >
                    <LayoutGrid className="w-5 h-5" />
                    瀏覽最新新聞
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8 pt-20">
            <div className="flex items-center gap-3 mb-8 px-4 sm:px-0">
                <Bookmark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    我的收藏
                </h1>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    {bookmarks.length}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarks.map((item) => (
                    <BookmarkCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
