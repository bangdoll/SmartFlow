import { supabase } from '@/lib/supabase';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Share2, ArrowLeft, Calendar, ExternalLink, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatBox } from '@/components/chat-box';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioPlayer } from '@/components/audio-player';
import { NewsContent } from '@/components/news-content';

// 強制動態渲染，確保獲取最新數據
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

// Helper to get news item with caching
const getNewsItem = cache(async (id: string) => {
    // Check if valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Check if Short UUID (8 chars)
    const shortUuidRegex = /^[0-9a-f]{8}$/i;

    let query = supabase.from('news_items').select('*, title_en');

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
    const item = await getNewsItem(id);

    if (!item) {
        return {
            title: 'News Not Found',
        };
    }

    const ogUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'https://smart-flow.rd.coach'}/api/og`);
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
    };
}

// Helper to fix common Markdown formatting issues
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
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://smart-flow.rd.coach'}/api/og?title=${encodeURIComponent(item.title)}&source=${encodeURIComponent(item.source)}`
        ],
        datePublished: item.published_at,
        dateModified: item.published_at,
        author: [{
            '@type': 'Organization',
            name: item.source || 'Smart Flow AI',
            url: item.original_url
        }],
        description: item.summary_zh || item.summary_en,
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Header handled by layout */}
            <NewsContent item={item} prev={prev} next={next} />
        </main>
    );
}
