'use client';

import Link from 'next/link';
import { Share2, ArrowLeft, Calendar, ExternalLink, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import remarkGfm from 'remark-gfm';
import { AudioPlayer } from '@/components/audio-player';
import { ChatBox } from '@/components/chat-box';
import { useLanguage } from '@/components/language-context';
import { preprocessMarkdown } from '@/lib/markdown';

interface NewsItem {
    id: string;
    title: string;
    title_en?: string | null;
    source: string;
    published_at: string;
    summary_zh: string | null;
    summary_en: string | null;
    original_url: string;
    audio_url?: string | null;
    audio_url_en?: string | null;
    tags?: string[] | null;
    slug?: string;
}

interface NavItem {
    id: string;
    title: string;
    slug?: string;
}

interface NewsContentProps {
    item: NewsItem;
    prev: NavItem | null;
    next: NavItem | null;
}



export function NewsContent({ item, prev, next }: NewsContentProps) {
    const { t, language } = useLanguage();

    // State for local content handling (to support on-the-fly translation update)
    const [localTitleEn, setLocalTitleEn] = useState(item.title_en || null);
    const [localSummaryEn, setLocalSummaryEn] = useState(item.summary_en || null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Effect: Trigger translation if needed
    useEffect(() => {
        if (language === 'en') {
            const missingTitle = !localTitleEn && item.title;
            // Note: Summary might be missing if not yet generated.
            const missingSummary = !localSummaryEn && item.summary_zh;

            if ((missingTitle || missingSummary) && !isTranslating) {
                const translate = async () => {
                    setIsTranslating(true);
                    try {
                        const res = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ newsId: item.id }),
                        });
                        const data = await res.json();
                        if (data.title_en) setLocalTitleEn(data.title_en);
                        if (data.summary_en) setLocalSummaryEn(data.summary_en);
                    } catch (error) {
                        console.error('Translation failed:', error);
                    } finally {
                        setIsTranslating(false);
                    }
                };
                translate();
            }
        }
    }, [language, item.id, localTitleEn, localSummaryEn, item.title, item.summary_zh, isTranslating]);

    const date = new Date(item.published_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
    });

    // Determine content based on language
    const currentTitleEn = localTitleEn || item.title_en;
    const currentSummaryEn = localSummaryEn || item.summary_en;

    // Strict Mode: Do not fallback to Chinese if EN is selected
    const displaySummary = language === 'en'
        ? (currentSummaryEn || 'Translating content... please wait...')
        : (item.summary_zh || currentSummaryEn || '');

    const displayTitle = language === 'en'
        ? (currentTitleEn || 'Translating title...')
        : item.title;

    const processedSummary = preprocessMarkdown(displaySummary);

    return (
        <div className="relative max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {t('news.backHome')}
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
                    {displayTitle}
                </h1>

                <AudioPlayer
                    newsId={item.id}
                    initialAudioUrl={language === 'en' ? item.audio_url_en : item.audio_url}
                    title={displayTitle}
                    language={language}
                />

                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-8 prose-table:border-collapse prose-table:w-full prose-th:bg-blue-50 dark:prose-th:bg-blue-900/30 prose-th:p-3 prose-td:p-3 prose-th:text-left prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedSummary}</ReactMarkdown>
                </div>

                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2 flex items-center">
                            {t('news.relatedTags')}:
                        </span>
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
                            {t('news.readOriginal')}
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
                                    {language === 'en' ? 'Previous' : '上一則'}
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
                                    {language === 'en' ? 'Next' : '下一則'}
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

            <ChatBox
                initialContext={{
                    title: displayTitle,
                    summary: displaySummary
                }}
            />
        </div>
    );
}
