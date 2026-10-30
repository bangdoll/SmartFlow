'use client';

import { useState, useEffect, useMemo, useRef, createContext, useContext, ReactNode } from 'react';
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

interface BookmarkNewsRecord {
    id: string;
    title: string;
    title_en?: string | null;
    summary_zh?: string | null;
    summary_en?: string | null;
    slug?: string | null;
    published_at: string;
    original_url: string;
    source: string;
    tags?: string[] | null;
}

interface BookmarkRow {
    news_items: BookmarkNewsRecord | BookmarkNewsRecord[] | null;
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

// Local storage is untrusted and can be left by an older or interrupted client.
function readLocalBookmarks(saved: string | null): BookmarkItem[] {
    if (!saved) return [];
    try {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((value): value is BookmarkItem => {
            if (!value || typeof value !== 'object') return false;
            const item = value as Record<string, unknown>;
            return ['id', 'title', 'summary', 'slug', 'published_at', 'original_url', 'source']
                .every(key => typeof item[key] === 'string') &&
                ['title_en', 'summary_en'].every(key => item[key] == null || typeof item[key] === 'string') &&
                (item.tags === undefined || (Array.isArray(item.tags) && item.tags.every(tag => typeof tag === 'string')));
        });
    } catch (error) {
        console.error('Unable to read local bookmarks:', error);
        return [];
    }
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isUserLoading } = useUser();
    const userId = user?.id ?? null;
    // A new token distinguishes A -> B -> A from the original A request.
    const owner = useMemo(() => ({ id: userId, authLoading: isUserLoading }), [userId, isUserLoading]);
    const activeOwner = useRef<typeof owner | null>(null);
    // Invalidate old continuations as soon as the owner renders. Waiting for
    // passive cleanup leaves a window where a completed sync can erase the
    // anonymous bookmarks that the signed-out/new account is about to load.
    activeOwner.current = owner;
    const [state, setState] = useState<{ owner: typeof owner | null; items: BookmarkItem[]; loading: boolean }>({
        owner: null, items: [], loading: true,
    });
    const supabase = useMemo(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
        return createClient();
    }, []);

    // Mask a previous account during render, before effects can clear its data.
    const bookmarks = !isUserLoading && state.owner === owner ? state.items : [];
    const isLoading = isUserLoading || state.owner !== owner || state.loading;

    useEffect(() => {
        let cancelled = false;
        activeOwner.current = owner;
        const isCurrent = () => !cancelled && activeOwner.current === owner;
        setState({ owner, items: [], loading: true });

        const load = async () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                const localItems = readLocalBookmarks(saved);
                if (!owner.id) {
                    if (isCurrent()) setState({ owner, items: localItems, loading: false });
                    return;
                }
                if (!supabase) return;

                if (localItems.length > 0) {
                    const { error } = await supabase.from('user_bookmarks').upsert(localItems.map(item => ({
                        user_id: owner.id, news_id: item.id, slug: item.slug,
                    })), { onConflict: 'user_id, news_id' });
                    if (!isCurrent()) return;
                    if (error) console.error('Failed to sync bookmarks:', error);
                    // Never delete anonymous additions made while a sync waited.
                    else if (localStorage.getItem(STORAGE_KEY) === saved) localStorage.removeItem(STORAGE_KEY);
                }

                const { data, error } = await supabase.from('user_bookmarks')
                    .select('news_id, news_items (*)')
                    .eq('user_id', owner.id)
                    .order('created_at', { ascending: false });
                if (!isCurrent()) return;
                if (error) throw error;
                const items = ((data || []) as unknown as BookmarkRow[]).map((row): BookmarkItem | null => {
                    const news = Array.isArray(row.news_items) ? row.news_items[0] : row.news_items;
                    if (!news) return null;
                    return {
                        id: news.id, title: news.title, title_en: news.title_en,
                        summary: news.summary_zh || '', summary_en: news.summary_en,
                        slug: news.slug || news.id, published_at: news.published_at,
                        original_url: news.original_url, source: news.source, tags: news.tags || [],
                    };
                }).filter((item): item is BookmarkItem => item !== null);
                setState({ owner, items, loading: false });
            } catch (error) {
                console.error('Failed to load bookmarks:', error);
            } finally {
                if (isCurrent()) setState(previous => previous.owner === owner ? { ...previous, loading: false } : previous);
            }
        };
        if (!isUserLoading) void load();
        return () => {
            cancelled = true;
            if (activeOwner.current === owner) activeOwner.current = null;
        };
    }, [owner, isUserLoading, supabase]);

    const addBookmark = async (item: BookmarkItem) => {
        if (isUserLoading || activeOwner.current !== owner) return;
        const previousItems = bookmarks;
        const next = [item, ...previousItems.filter(saved => saved.id !== item.id)];
        setState(previous => previous.owner === owner ? { ...previous, items: next } : previous);
        try {
            if (owner.id) {
                if (!supabase) throw new Error('Supabase is not configured');
                const { error } = await supabase.from('user_bookmarks').insert({
                    user_id: owner.id, news_id: item.id, slug: item.slug,
                });
                if (error) throw error;
            } else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
            console.error('Failed to add bookmark:', error);
            if (activeOwner.current === owner) setState(previous => previous.owner === owner ? { ...previous, items: previousItems } : previous);
        }
    };

    const removeBookmark = async (id: string) => {
        if (isUserLoading || activeOwner.current !== owner) return;
        const previousItems = bookmarks;
        const next = previousItems.filter(item => item.id !== id);
        setState(previous => previous.owner === owner ? { ...previous, items: next } : previous);
        try {
            if (owner.id) {
                if (!supabase) throw new Error('Supabase is not configured');
                const { error } = await supabase.from('user_bookmarks').delete()
                    .eq('user_id', owner.id).eq('news_id', id);
                if (error) throw error;
            } else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
            if (activeOwner.current === owner) setState(previous => previous.owner === owner ? { ...previous, items: previousItems } : previous);
        }
    };

    return (
        <BookmarksContext.Provider value={{ bookmarks, addBookmark, removeBookmark,
            isBookmarked: id => bookmarks.some(item => item.id === id), isLoading }}>
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
