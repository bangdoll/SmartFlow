import { supabase } from '@/lib/supabase';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';
import { NewsContent } from '@/components/news-content';
import { SITE_URL } from '@/lib/site';
import { serializeJsonLd } from '@/lib/json-ld';
import { getCanonicalNewsId, getNewsPath, isFullNewsId } from '@/lib/news-url';

// News changes through the scheduled scraper, so ISR avoids regenerating the
// same article for every crawler and visitor. Articles are immutable after
// publication in normal operation, so a one-day window avoids unnecessary
// function invocations and ISR writes while keeping new pages discoverable.
export const revalidate = 86400;

interface Props {
    params: Promise<{ id: string }>;
}

// Helper to get news item with caching
const getNewsItem = cache(async (id: string) => {
    // Check if valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Check if Short UUID (8 chars)
    const shortUuidRegex = /^[0-9a-f]{8}$/i;

    // Keep the server-rendered payload limited to fields used by the detail
    // view. Selecting `*` also serializes maintenance columns into the ISR
    // response and increases origin transfer for every article visit.
    let query = supabase
        .from('news_items')
        .select('id, title, title_en, source, published_at, summary_zh, summary_en, original_url, audio_url, audio_url_en, tags, slug');

    if (uuidRegex.test(id)) {
        query = query.eq('id', id);
    } else if (shortUuidRegex.test(id)) {
        // Handle 8-char Short ID logic using Range Query (UUID type safe)
        // Prefix is the first 8 chars group of UUID (e.g. 12345678-...)
        // We construct the Min and Max possible UUIDs for this prefix.
        const minUUID = `${id}-0000-0000-0000-000000000000`;
        const maxUUID = `${id}-ffff-ffff-ffff-ffffffffffff`;

        query = query.gte('id', minUUID).lte('id', maxUUID);
    } else {
        // Assume slug
        query = query.eq('slug', id);
    }

    const { data: item, error } = await query.single();
    if (error || !item) return null;
    return item;
});

async function getAdjacentNews(currentDate: string) {
    const [prev, next] = await Promise.all([
        // Previous news (older)
        supabase
            .from('news_items')
            .select('id, slug, title, title_en')
            .lt('published_at', currentDate)
            .order('published_at', { ascending: false })
            .limit(1)
            .single(),

        // Next news (newer)
        supabase
            .from('news_items')
            .select('id, slug, title, title_en')
            .gt('published_at', currentDate)
            .order('published_at', { ascending: true })
            .limit(1)
            .single()
    ]);

    return {
        prev: prev.data,
        next: next.data
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    // UUID links from older sitemaps can be canonicalized without a database
    // lookup. This keeps legacy crawler traffic away from Supabase entirely.
    if (isFullNewsId(id)) {
        return {
            alternates: {
                canonical: `${SITE_URL}${getNewsPath(id)}`,
            },
        };
    }

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

    // Full UUIDs are legacy aliases. Redirect before any Supabase query so an
    // old sitemap or crawler cannot spend a database/ISR render for a second
    // cache key.
    if (isFullNewsId(id)) {
        permanentRedirect(getNewsPath(id));
    }

    const item = await getNewsItem(id);

    if (!item) {
        notFound();
    }

    // Avoid rendering the same article under UUID, slug, and short-ID cache
    // keys. Old links continue to work, but only the short URL renders HTML.
    const canonicalId = getCanonicalNewsId(item.id);
    if (id !== canonicalId) {
        permanentRedirect(getNewsPath(item.id));
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
            <NewsContent item={item} prev={prev} next={next} />
        </main>
    );
}
