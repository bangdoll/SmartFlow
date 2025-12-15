import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { NewsFeed } from '@/components/news-feed'; // Reusing NewsFeed or creating a simplified version? NewsFeed handles fetching internally usually? 
// Wait, NewsFeed in this project handles its own fetching based on props? 
// Let's check src/components/news-feed.tsx logic first. 
// If NewsFeed fetches its own data, I might need to pass "initialItems" or "searchQuery" to it.
// Let's look at NewsFeed interface first.
// Assuming NewsFeed accepts `initialItems` or I can just render the items manually reusing the card component.
// Actually, better to fetch here and pass to a "NewsList" or reuse NewsFeed if it supports "initialItems" fully.
// Checking NewsFeed props in previous turn... it has `initialItems`.
// BUT, NewsFeed also has "load more" logic which calls `/api/news`.
// I should probably make intrinsic search support in `/api/news` OR handle it here.
// Let's stick to Server Side Rendering of search results for simplicity first.

// NOTE: Implementing a simple list for search results first to ensure it works. 
import Link from 'next/link';
import { Calendar, ExternalLink, Tag } from 'lucide-react';
import { SearchResultsList } from '@/components/search-results-list';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || '';

    // Simple search filtering using Supabase
    let items = [];
    if (query) {
        const { data, error } = await supabase
            .from('news_items')
            .select('*')
            // Using 'or' with 'ilike' for multi-column search (title, summary_zh, summary_en, tags)
            .or(`title.ilike.%${query}%,summary_zh.ilike.%${query}%,summary_en.ilike.%${query}%`)
            .order('published_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Search error:', error);
        }
        if (data) items = data;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Header />

            <SearchResultsList items={items} query={query} />

        </main>
    );
}
