'use client';

import { useBookmarks, BookmarkItem } from '@/hooks/use-bookmarks';
import { Bookmark } from 'lucide-react';

interface BookmarkButtonProps {
    item: BookmarkItem;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function BookmarkButton({ item, className, size = 'md' }: BookmarkButtonProps) {
    const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
    const active = isBookmarked(item.id);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (active) {
            removeBookmark(item.id);
        } else {
            addBookmark(item);
        }
        // Optimistic UI update handled by effect or simple toggle
        // Context updates are usually fast enough.
    };

    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${active
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20'
                    : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${className || ''}`}
            title={active ? 'Remove bookmark' : 'Bookmark this article'}
            aria-label={active ? 'Remove bookmark' : 'Bookmark this article'}
        >
            <Bookmark
                size={iconSize}
                fill={active ? "currentColor" : "none"}
            />
        </button>
    );
}
