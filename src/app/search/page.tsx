import { supabase } from '@/lib/supabase';
import { SearchResultsList } from '@/components/search-results-list';
import { ilikePattern, normalizeSearchTerm } from '@/lib/search-query';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = normalizeSearchTerm(params.q || '');

    // Simple search filtering using Supabase
    let items = [];
    if (query) {
        const { data, error } = await supabase
            .from('news_items')
            .select('*')
            // Using 'or' with 'ilike' for multi-column search (title, summary_zh, summary_en, tags)
            .or(`title.ilike.${ilikePattern(query)},summary_zh.ilike.${ilikePattern(query)},summary_en.ilike.${ilikePattern(query)}`)
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
            <SearchResultsList items={items} query={query} />

        </main>
    );
}
