'use client';

import { NewsItem } from '@/types';
import { Flame, ExternalLink, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';

interface HotNewsProps {
    items: NewsItem[];
}

import { useState, useEffect } from 'react';

export function HotNewsSection({ items: initialItems }: HotNewsProps) {
    const { t, language } = useLanguage();
    const [hotItems, setHotItems] = useState<NewsItem[]>(initialItems);
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setHotItems(initialItems);
    }, [initialItems]);

    // Batch Translation Logic
    useEffect(() => {
        if (language !== 'en') {
            setTranslatingIds(new Set());
            return;
        }

        const itemsToTranslate = hotItems.filter(
            item => !item.title_en && !translatingIds.has(item.id)
        );

        if (itemsToTranslate.length === 0) return;

        const ids = itemsToTranslate.map(i => i.id);

        setTranslatingIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });

        fetch('/api/translate/batch', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    setHotItems(prev => prev.map(item => {
                        const updated = data.results.find((u: any) => u.id === item.id);
                        return updated ? { ...item, title_en: updated.title_en, summary_en: updated.summary_en } : item;
                    }));
                }
            })
            .finally(() => {
                setTranslatingIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            });
    }, [language, hotItems, translatingIds]);

    if (!hotItems || hotItems.length === 0) return null;

    const handleNewsClick = async (id?: string) => {
        if (!id) return;
        try {
            await fetch('/api/news/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch (e) {
            console.error('Failed to track click', e);
        }
    };

    return (
        <section className="mb-12 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Flame className="w-5 h-5 text-orange-600 dark:text-orange-500 fill-orange-600 dark:fill-orange-500" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                    {t('home.hot')}
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {hotItems.map((item, index) => {
                    const showEn = language === 'en';
                    const hasEn = !!item.title_en;

                    const displayTitle = showEn
                        ? (item.title_en || 'Translating...')
                        : item.title;
                    const displaySummary = showEn
                        ? (item.summary_en || 'Translating...')
                        : item.summary_zh;

                    // Strict Mode: Skeleton
                    if (showEn && !hasEn) {
                        return (
                            <article
                                key={item.id || index}
                                className="relative h-full flex flex-col bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-orange-100/50 dark:border-orange-900/30 p-5 animate-pulse"
                            >
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md"></div>
                                <div className="flex items-center gap-2 mb-3 ml-2">
                                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                </div>
                                <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                                <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                                <div className="mt-auto h-16 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="mt-4 flex justify-end">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                </div>
                            </article>
                        );
                    }

                    return (
                        <article
                            key={item.id || index}
                            className="group relative flex flex-col h-full bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-md rounded-2xl border border-orange-100/50 dark:border-orange-900/30 p-5 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300"
                        >
                            {/* Overlay Link for Whole Card */}
                            <Link
                                href={`/news/${item.slug || item.id}`}
                                onClick={() => handleNewsClick(item.id)}
                                className="absolute inset-0 z-0"
                                aria-label={`Read more about ${displayTitle}`}
                            />

                            {/* Rank Badge */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold rounded-lg shadow-md transform rotate-3 group-hover:rotate-6 transition-transform z-10 pointer-events-none">
                                {index + 1}
                            </div>

                            <div className="relative z-10 pointer-events-none">
                                <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 mb-3 ml-2">
                                    <span>{item.source}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        🔥 {item.click_count || 0} 點擊
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    {displayTitle}
                                </h3>

                                {/* Summary Snippet */}
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-auto">
                                    {preprocessMarkdown(displaySummary || null)}
                                </p>
                            </div>

                            <div className="mt-4 flex justify-end relative z-10 pointer-events-none">
                                <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
