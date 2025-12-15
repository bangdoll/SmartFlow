import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Share2, ArrowLeft, Calendar, ExternalLink, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatBox } from '@/components/chat-box';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioPlayer } from '@/components/audio-player';

// 強制動態渲染，確保獲取最新數據
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

async function getNewsItem(idOrSlug: string) {
    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const query = supabase
        .from('news_items')
        .select('*');

    if (isUuid) {
        query.eq('id', idOrSlug);
    } else {
        query.eq('slug', idOrSlug);
    }

    const { data: item } = await query.single();
    return item;
}

async function getAdjacentNews(currentDate: string) {
    const [prev, next] = await Promise.all([
        // Previous news (older)
        supabase
            .from('news_items')
            .select('id, slug, title')
            .lt('published_at', currentDate)
            .order('published_at', { ascending: false })
            .limit(1)
            .single(),

        // Next news (newer)
        supabase
            .from('news_items')
            .select('id, slug, title')
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

    const ogUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-smart-flow.vercel.app'}/api/og`);
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
    // Look for separator line, find previous header line, ensure blank line before header.
    // Regex: (HeaderLine match) (Newline) (SeparatorLine)
    // We already handled explicit text above, this handles generic cases.
    processed = processed.replace(
        /([^\n])\n((\|.*?\|){2,})\n(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$2\n$4'
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

    const date = new Date(item.published_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
    });

    const summary = preprocessMarkdown(item.summary_zh || item.summary_en);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Header />

            <div className="relative max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    返回首頁
                </Link>

                <article className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-gray-800/50 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                            {item.source}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {date}
                        </span>
                    </div>


                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                        {item.title}
                    </h1>

                    <AudioPlayer newsId={item.id} initialAudioUrl={item.audio_url} title={item.title} />


                    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-8 prose-table:border-collapse prose-table:w-full prose-th:bg-blue-50 dark:prose-th:bg-blue-900/30 prose-th:p-3 prose-td:p-3 prose-th:text-left prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            {item.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="flex flex-col gap-6 pt-8 border-t border-gray-100 dark:border-gray-800">

                        {/* 1. Read Original (Center - Primary Action) */}
                        <div className="flex justify-center">
                            <Link
                                href={item.original_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-lg group"
                            >
                                閱讀原文
                                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* 2. Previous / Next Navigation */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {prev ? (
                                <Link
                                    href={`/news/${prev.slug || prev.id}`}
                                    className="flex flex-col items-start p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-left"
                                >
                                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1 group-hover:text-blue-500 transition-colors">
                                        <ChevronLeft className="w-3 h-3" />
                                        上一則
                                    </span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {prev.title}
                                    </span>
                                </Link>
                            ) : (
                                <div /> /* Empty placeholder */
                            )}

                            {next ? (
                                <Link
                                    href={`/news/${next.slug || next.id}`}
                                    className="flex flex-col items-end p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-right"
                                >
                                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1 group-hover:text-blue-500 transition-colors">
                                        下一則
                                        <ChevronRight className="w-3 h-3" />
                                    </span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {next.title}
                                    </span>
                                </Link>
                            ) : (
                                <div /> /* Empty placeholder */
                            )}
                        </div>
                    </div>
                </article>
            </div>

            <ChatBox
                initialContext={{
                    title: item.title,
                    summary: item.summary_zh || item.summary_en || ''
                }}
            />
        </main>
    );
}
