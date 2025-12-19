'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface BookmarkItem {
    id: string;
    title: string;
    title_en?: string | null;
    summary: string;
    summary_en?: string | null;
    slug: string;
    published_at: string;
    original_url: string;
    source: string;
    tags?: string[];
}

interface BookmarksContextType {
    bookmarks: BookmarkItem[];
    addBookmark: (item: BookmarkItem) => void;
    removeBookmark: (id: string) => void;
    isBookmarked: (id: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

const STORAGE_KEY = 'sf_bookmarks';

export function BookmarksProvider({ children }: { children: ReactNode }) {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

    useEffect(() => {
        // Load on mount
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setBookmarks(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load bookmarks', e);
        }
    }, []);

    const saveToStorage = (newBookmarks: BookmarkItem[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
        } catch (e) {
            console.error('Failed to save bookmarks', e);
        }
    };

    const addBookmark = (item: BookmarkItem) => {
        setBookmarks(prev => {
            if (prev.some(b => b.id === item.id)) return prev;
            const next = [item, ...prev];
            saveToStorage(next);
            return next;
        });
    };

    const removeBookmark = (id: string) => {
        setBookmarks(prev => {
            const next = prev.filter(b => b.id !== id);
            saveToStorage(next);
            return next;
        });
    };

    const isBookmarked = (id: string) => {
        return bookmarks.some(b => b.id === id);
    };

    return (
        <BookmarksContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }
        }>
            {children}
        </BookmarksContext.Provider>
    );
}

export function useBookmarks() {
    const context = useContext(BookmarksContext);
    if (!context) {
        throw new Error('useBookmarks must be used within a BookmarksProvider');
    }
    return context;
}
