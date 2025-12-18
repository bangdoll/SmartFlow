import { NewsFeed } from '@/components/news-feed';
import { supabase } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Allow any tag
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ tag: string }>;
}

async function getNewsByTag(tag: string): Promise<NewsItem[]> {
    const { data: items } = await supabase
        .from('news_items')
        .select('*')
        .contains('tags', [tag])
        .order('published_at', { ascending: false })
        .limit(50);

    return items || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);

    return {
        title: `${decodedTag} News & Trends - Smart Flow`,
        description: `Latest AI news and updates about ${decodedTag}. Stay ahead of the curve with our curated daily digest.`,
        alternates: {
            canonical: `/tags/${tag}`,
        },
        openGraph: {
            title: `${decodedTag} News - Smart Flow`,
            description: `Stay updated with the latest ${decodedTag} news.`
        }
    };
}

export default async function TagPage({ params }: Props) {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const items = await getNewsByTag(decodedTag);

    // Schema.org Breadcrumb
    const breadcrumbJson = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": process.env.PRODUCTION_URL || "https://smart-flow.rd.coach"
        }, {
            "@type": "ListItem",
            "position": 2,
            "name": decodedTag,
            "item": `${process.env.PRODUCTION_URL || "https://smart-flow.rd.coach"}/tags/${tag}`
        }]
    };

    if (!items || items.length === 0) {
        // Option: Show empty state instead of 404?
        // But for SEO 404 is better if tag truly invalid. 
        // However, since tags are dynamic, maybe empty state is safer UI.
        // Let's return empty list to NewsFeed.
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
            />

            <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24 sm:pt-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        #{decodedTag}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Topic Focus
                    </p>
                </div>

                <NewsFeed initialItems={items} initialTag={decodedTag} mode="default" />
            </div>
        </main>
    );
}
