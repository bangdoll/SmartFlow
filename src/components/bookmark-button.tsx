'use client';

import { useBookmarks, BookmarkItem } from '@/hooks/use-bookmarks';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists, or I will use clsx/tailwind-merge directly if not sure
import { useState, useEffect } from 'react';

// Simplified cn if not available, but usually it is in shadcn/ui projects.
// Start of file check showed clsx and tailwind-merge in package.json.
// I'll assume lib/utils exists or create a local utility.

interface BookmarkButtonProps {
    item: BookmarkItem;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function BookmarkButton({ item, className, size = 'md' }: BookmarkButtonProps) {
    const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
    const [active, setActive] = useState(false);

    // Sync with global state
    useEffect(() => {
        setActive(isBookmarked(item.id));
    }, [isBookmarked, item.id]);

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
