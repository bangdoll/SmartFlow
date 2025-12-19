'use client';

import Link from 'next/link';
import { Share2, ArrowLeft, Calendar, ExternalLink, Clock, Tag, ChevronLeft, ChevronRight, ArrowRight, Mail } from 'lucide-react';
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
    title_en?: string | null;
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

    // Language-based summary selection with fallback
    // Chinese: prefer summary_zh, fallback to summary_en
    // English: prefer summary_en, show placeholder if translating
    const displaySummary = language === 'en'
        ? (currentSummaryEn || 'Translating content... please wait...')
        : (item.summary_zh && item.summary_zh.trim() !== '' ? item.summary_zh : (currentSummaryEn || ''));

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

                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-8 
                    leading-loose tracking-wide
                    prose-p:mb-6 prose-headings:font-bold prose-headings:tracking-tight
                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-xl prose-img:shadow-lg
                    prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden
                    prose-th:bg-gray-50 dark:prose-th:bg-gray-800/50 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-gray-900 dark:prose-th:text-white
                    prose-td:p-4 prose-td:border-t prose-td:border-gray-100 dark:prose-td:border-gray-800
                    prose-li:marker:text-blue-500
                    ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedSummary}</ReactMarkdown>
                </div>

                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2 flex items-center">
                            {t('news.relatedTags')}:
                        </span>
                        {item.tags.map((tag: string) => (
                            <a
                                key={tag}
                                href={`/tags/${encodeURIComponent(tag)}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                            </a>
                        ))}
                    </div>
                )}

                {/* Share Buttons */}
                <div className="flex items-center justify-center gap-4 mb-8 py-4 border-y border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {language === 'en' ? 'Share:' : '分享：'}
                    </span>
                    <button
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/news/${item.slug || item.id.substring(0, 8)}`;
                            const text = `[新趨勢] ${displayTitle}`;
                            navigator.clipboard.writeText(`${text} ${shareUrl}`);
                            alert(language === 'en' ? 'Link copied!' : '連結已複製！');
                        }}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={language === 'en' ? 'Copy link' : '複製連結'}
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/news/${item.slug || item.id.substring(0, 8)}`;
                            const text = `[新趨勢] ${displayTitle}`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-black dark:hover:bg-white rounded-full text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-black transition-colors"
                        title={language === 'en' ? 'Share on X' : '分享到 X'}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/news/${item.slug || item.id.substring(0, 8)}`;
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-full text-gray-600 dark:text-gray-300 hover:text-white transition-colors"
                        title={language === 'en' ? 'Share on Facebook' : '分享到 Facebook'}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>

                {/* --- POST-READ ACTION BLOCK (Wireframe 3) --- */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 mb-8 text-center">
                    {next ? (
                        // CASE 1: NOT LAST -> ONLY NEXT ACTION
                        <>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                                👇 {language === 'en' ? 'Next step - No thinking needed' : '下一步不用想'}
                            </h3>
                            <Link
                                href={`/news/${next.slug || next.id}`}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                {t('article.action.next')} <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </>
                    ) : (
                        // CASE 2: LAST ARTICLE -> COMPLETION + SUBSCRIBE
                        <>
                            <div className="mb-6">
                                <span className="text-4xl mb-2 block">👍</span>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {t('article.action.endTitle')}
                                </h3>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm max-w-md mx-auto">
                                <p className="text-gray-600 dark:text-gray-300 mb-4 font-medium">
                                    {t('article.action.endSubscribe')}
                                </p>
                                <button
                                    onClick={() => {
                                        // Scroll to or Open Subscribe
                                        // If subscribe form is not on this page (it's not), we might need to navigate home#subscribe or show modal
                                        // Since we are on detail page, let's navigate to home#subscribe
                                        window.location.href = '/#subscribe';
                                    }}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    {t('article.action.endButton')}
                                </button>
                            </div>
                        </>
                    )}
                </div>

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
                                    {(language === 'en' && prev.title_en) ? prev.title_en : prev.title}
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
                                    {(language === 'en' && next.title_en) ? next.title_en : next.title}
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
