'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useUser } from '@/components/user-provider';
import { createClient } from '@/utils/supabase/client';

export interface BookmarkItem {
    id: string; // news_item id
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
    addBookmark: (item: BookmarkItem) => Promise<void>;
    removeBookmark: (id: string) => Promise<void>;
    isBookmarked: (id: string) => boolean;
    isLoading: boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

const STORAGE_KEY = 'sf_bookmarks';

export function BookmarksProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isUserLoading } = useUser();
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // 1. Fetch Logic
    const fetchBookmarks = async () => {
        setIsLoading(true);
        try {
            if (user) {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('user_bookmarks')
                    .select('news_id, news_items (*)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform to BookmarkItem
                const items = (data || []).map((row: any) => {
                    const news = row.news_items;
                    if (!news) return null;

                    return {
                        id: news.id,
                        title: news.title,
                        title_en: news.title_en,
                        summary: news.summary_zh || '',
                        summary_en: news.summary_en,
                        slug: news.slug || news.id,
                        published_at: news.published_at,
                        original_url: news.original_url,
                        source: news.source,
                        tags: news.tags || []
                    } as BookmarkItem;
                }).filter((item): item is BookmarkItem => item !== null);

                setBookmarks(items);
            } else {
                // Anonymous: Load from localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setBookmarks(JSON.parse(saved));
                }
            }
        } catch (e) {
            console.error('Failed to load bookmarks', e);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Sync Logic (Run once when user logs in)
    useEffect(() => {
        if (isUserLoading) return;

        const syncLocalToCloud = async () => {
            const savedLocal = localStorage.getItem(STORAGE_KEY);
            if (!user || !savedLocal) {
                fetchBookmarks();
                return;
            }

            const localItems: BookmarkItem[] = JSON.parse(savedLocal);
            if (localItems.length === 0) {
                fetchBookmarks();
                return;
            }

            // Perform Sync: Insert local items into DB
            const bookmarksToInsert = localItems.map(item => ({
                user_id: user.id,
                news_id: item.id,
                slug: item.slug
            }));

            // Using upsert
            const { error } = await supabase
                .from('user_bookmarks')
                .upsert(bookmarksToInsert, { onConflict: 'user_id, news_id' });

            if (!error) {
                localStorage.removeItem(STORAGE_KEY);
                console.log('Synced local bookmarks to cloud');
            } else {
                console.error('Failed to sync bookmarks', error);
            }

            // Re-fetch to get merged state
            fetchBookmarks();
        };

        syncLocalToCloud();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isUserLoading]);

    const addBookmark = async (item: BookmarkItem) => {
        // Optimistic update
        const prevBookmarks = bookmarks;
        setBookmarks(prev => [item, ...prev]);

        try {
            if (user) {
                const { error } = await supabase.from('user_bookmarks').insert({
                    user_id: user.id,
                    news_id: item.id,
                    slug: item.slug
                });
                if (error) throw error;
            } else {
                const next = [item, ...prevBookmarks];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
        } catch (e) {
            console.error('Failed to add bookmark', e);
            setBookmarks(prevBookmarks); // Revert
        }
    };

    const removeBookmark = async (id: string) => {
        const prevBookmarks = bookmarks;
        setBookmarks(prev => prev.filter(b => b.id !== id));

        try {
            if (user) {
                const { error } = await supabase
                    .from('user_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('news_id', id);
                if (error) throw error;
            } else {
                const next = prevBookmarks.filter(b => b.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
        } catch (e) {
            console.error('Failed to remove bookmark', e);
            setBookmarks(prevBookmarks); // Revert
        }
    };

    const isBookmarked = (id: string) => {
        return bookmarks.some(b => b.id === id);
    };

    return (
        <BookmarksContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, isLoading }}>
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
