'use client';

import { NewsItem } from '@/types';
import { Flame, ExternalLink, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface HotNewsProps {
    items: NewsItem[];
}

export function HotNewsSection({ items }: HotNewsProps) {
    if (!items || items.length === 0) return null;

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
                    本日焦點
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {items.map((item, index) => (
                    <article
                        key={item.id || index}
                        className="group relative flex flex-col h-full bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-md rounded-2xl border border-orange-100/50 dark:border-orange-900/30 p-5 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300"
                    >
                        {/* Rank Badge */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold rounded-lg shadow-md transform rotate-3 group-hover:rotate-6 transition-transform">
                            {index + 1}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 mb-3 ml-2">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                🔥 {item.click_count || 0} 點擊
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            <Link
                                href={item.original_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleNewsClick(item.id)}
                            >
                                <span className="absolute inset-0" />
                                {item.title}
                            </Link>
                        </h3>

                        {/* Summary Snippet - optional, maybe just title for cards to save space? 
                            Let's include specific "Takeaway" if available or short summary 
                        */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-auto">
                            {item.summary_zh}
                        </p>

                        <div className="mt-4 flex justify-end">
                            <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
