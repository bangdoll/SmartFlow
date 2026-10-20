import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { NewsContent } from '@/components/news-content';
import { SITE_URL } from '@/lib/site';
import { serializeJsonLd } from '@/lib/json-ld';
import { getNewsPath } from '@/lib/news-url';

// Cache public HTML/RSC together. New short IDs are generated on demand.
// UUID/slug aliases use a separate dynamic resolver that returns HTTP 308.
export const revalidate = 600;
export async function generateStaticParams() { return []; }

interface Props {
    params: Promise<{ id: string }>;
}

// Helper to get news item with caching
const getNewsItem = cache(async (id: string) => {
    if (!isSupabaseConfigured()) return null;

    if (!/^[0-9a-f]{8}$/i.test(id)) return null;

    // Canonical pages only. Proxy sends UUID/slug aliases to a dynamic resolver
    // so Next's ISR redirect serialization cannot duplicate Location headers.
    const { data: item, error } = await supabase.from('news_items')
        .select('id, title, title_en, source, published_at, summary_zh, summary_en, original_url, audio_url, audio_url_en, tags, slug')
        .gte('id', `${id}-0000-0000-0000-000000000000`)
        .lte('id', `${id}-ffff-ffff-ffff-ffffffffffff`)
        .maybeSingle();
    // Only a genuine missing row should become a cached 404. A transient
    // database failure must fail revalidation and preserve the last good result.
    if (error) {
        throw new Error('Unable to load news item', { cause: error });
    }
    if (!item) return null;
    return item;
});

const getAdjacentNews = cache(async (currentDate: string) => {
    const [prev, next] = await Promise.all([
        // Previous news (older)
        supabase
            .from('news_items')
            .select('id, slug, title, title_en')
            .lt('published_at', currentDate)
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

        // Next news (newer)
        supabase
            .from('news_items')
            .select('id, slug, title, title_en')
            .gt('published_at', currentDate)
            .order('published_at', { ascending: true })
            .limit(1)
            .maybeSingle()
    ]);

    for (const result of [prev, next]) {
        if (result.error) {
            throw new Error('Unable to load adjacent news', { cause: result.error });
        }
    }

    return {
        prev: prev.data,
        next: next.data
    };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    const item = await getNewsItem(id);

    if (!item) {
        return {
            title: 'News Not Found',
        };
    }

    const ogUrl = new URL(`${SITE_URL}/api/og`);
    ogUrl.searchParams.set('title', item.title);
    if (item.source) ogUrl.searchParams.set('source', item.source);

    return {
        title: item.title,
        description: item.summary_zh || item.summary_en,
        openGraph: {
            title: item.title,
            description: item.summary_zh || item.summary_en,
            type: 'article',
            images: [
                {
                    url: ogUrl.toString(),
                    width: 1200,
                    height: 630,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: item.title,
            description: item.summary_zh || item.summary_en,
            images: [ogUrl.toString()],
        },
        alternates: {
            canonical: `${SITE_URL}${getNewsPath(item.id)}`,
        },
    };
}

// Helper to fix common Markdown formatting issues
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preprocessMarkdown(content: string | null): string {
    if (!content) return '';

    let processed = content;

    // 1. Fix: Text stuck to table (Same line)
    // Ex: "Introduction. | Header 1 | Header 2 | |---|---|"
    // Replaces char -> newline -> newline -> header -> newline -> separator
    processed = processed.replace(
        /([^|\n])(\s*)(\|.*?\|.*?\|)(\s*)(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$3\n$5'
    );

    // 2. Fix: Text stuck to table (Next line but no blank line)
    // Ex: "Introduction.\n| Header 1 | Header 2 |\n|---|---|"
    processed = processed.replace(
        /([^|\n])\n(\|.*?\|.*?\|)\n(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$2\n$3'
    );

    // 3. Fix: Header stuck to Separator (Same line, no preceding text issue)
    // Ex: "| Header | Header | |---|---|" -> "| Header | Header |\n|---|---|"
    processed = processed.replace(
        /(\|.*?\|.*?\|)(\s*)(\|[-:]+[-| :]*\|)/g,
        '$1\n$3'
    );

    // 4. Ensure empty line before table if pattern is just "newline + pipe"
    // Fallback for general cases where previous text is clean but just missing blank line
    processed = processed.replace(
        /([^\n])\n((\|.*?\|){2,})\n(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$2\n$4'
    );

    // 5. Cleanup LLM specific placeholder artifacts
    // In early versions, the LLM outputted "[Paragraph 1: Background...]" as text.
    // We strip this specific pattern and its variations.
    processed = processed.replace(
        /\[Paragraph 1: Background & What happened.*?\].*?\n/gi,
        ''
    );
    processed = processed.replace(
        /\(Start directly with a paragraph explaining.*?\).*?\n/gi,
        ''
    );

    return processed;
}

export default async function NewsDetailPage({ params }: Props) {
    const { id } = await params;

    const item = await getNewsItem(id);

    if (!item) {
        notFound();
    }

    // Fetch adjacent news
    const { prev, next } = await getAdjacentNews(item.published_at);

    // JSON-LD for NewsArticle
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: item.title,
        image: [
            `${SITE_URL}/api/og?title=${encodeURIComponent(item.title)}&source=${encodeURIComponent(item.source)}`
        ],
        datePublished: item.published_at,
        dateModified: item.published_at,
        author: [{
            '@type': 'Organization',
            name: 'Smart Flow Team',
            url: SITE_URL
        }],
        description: item.summary_zh || item.summary_en,
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            {/* Header handled by layout */}
            <NewsContent key={item.id} item={item} prev={prev} next={next} />
        </main>
    );
}
