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

            <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        搜尋結果: <span className="text-blue-600">{query}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        找到 {items.length} 篇相關文章
                    </p>
                </div>

                <div className="space-y-6">
                    {items.length > 0 ? (
                        items.map((item) => {
                            const date = new Date(item.published_at).toLocaleDateString('zh-TW', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                timeZone: 'Asia/Taipei',
                            });
                            return (
                                <article
                                    key={item.id}
                                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {date}
                                            </span>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        <Link href={`/news/${item.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            {item.title}
                                        </Link>
                                    </h2>

                                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                                        {item.summary_zh || item.summary_en}
                                    </p>

                                    {item.tags && (
                                        <div className="flex flex-wrap gap-2">
                                            {(item.tags as string[]).map(tag => (
                                                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            )
                        })
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            沒有找到相關新聞，試試其他關鍵字？
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
