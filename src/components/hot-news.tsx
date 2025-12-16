'use client';

import { NewsItem } from '@/types';
import { Flame, ExternalLink, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from './language-context';
import { preprocessMarkdown } from '@/lib/markdown';

interface HotNewsProps {
    items: NewsItem[];
}

import { useState, useEffect, useRef } from 'react';

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

    // Inject useRouter - actually not needed if we use Links
    const router = useRouter();

    // Drag detection for Hot News
    const dragStart = useRef<{ x: number, y: number } | null>(null);

    const handleCardMouseDown = (e: React.MouseEvent) => {
        dragStart.current = { x: e.clientX, y: e.clientY };
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
                    const displayTitle = showEn ? (item.title_en || 'Translating...') : item.title;
                    const displaySummary = showEn ? (item.summary_en || 'Translating...') : item.summary_zh;

                    if (showEn && !hasEn) { /* Skeleton */ return <div key={index} className="skeleton" />; }

                    return (


                        // ... inside map ...
                        <article
                            key={item.id || index}
                            onMouseDown={handleCardMouseDown}
                            onClick={(e) => {
                                // 1. Check Drag
                                if (dragStart.current) {
                                    const dx = e.clientX - dragStart.current.x;
                                    const dy = e.clientY - dragStart.current.y;
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    dragStart.current = null;
                                    if (dist > 5) return;
                                }

                                // 2. Navigate
                                handleNewsClick(item.id);
                                router.push(`/news/${item.slug || item.id}`);
                            }}
                            className="group relative flex flex-col h-full bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-md rounded-2xl border border-orange-100/50 dark:border-orange-900/30 p-5 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        >
                            {/* Rank Badge */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold rounded-lg shadow-md transform rotate-3 group-hover:rotate-6 transition-transform z-10">
                                {index + 1}
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 mb-3 ml-2">
                                    <span>{item.source}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        🔥 {item.click_count || 0} 點擊
                                    </span>
                                </div>

                                {/* Title - EXTERNAL LINK (Stop Propagation) */}
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    <a
                                        href={item.original_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNewsClick(item.id);
                                        }}
                                        className="hover:underline cursor-pointer"
                                    >
                                        {displayTitle}
                                        <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
                                    </a>
                                </h3>

                                {/* Summary Snippet - Regular Div (Bubbles to Card) */}
                                <div className="block mt-auto group/summary">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 group-hover/summary:text-orange-600 dark:group-hover/summary:text-orange-400 transition-colors">
                                        {preprocessMarkdown(displaySummary || null)}
                                    </p>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNewsClick(item.id);
                                            router.push(`/news/${item.slug || item.id}`);
                                        }}
                                        className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
