'use client';

import { NewsItem } from '@/types';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

interface DailyInsightProps {
    insightItem: NewsItem | null;
}

export function DailyInsight({ insightItem }: DailyInsightProps) {
    if (!insightItem) return null;

    return (
        <section className="mb-12">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">

                {/* Decorative Background Element */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-200 dark:bg-amber-700/20 rounded-full blur-2xl opacity-50 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Icon Column */}
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shadow-inner">
                            <Sparkles className="w-7 h-7 fill-current" />
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-sm font-bold tracking-wider text-amber-700 dark:text-amber-500 uppercase">
                                ☀️ 今日智流一句話
                            </h2>
                            <span className="text-xs text-amber-600/60 dark:text-amber-500/50 hidden sm:inline-block">|</span>
                            <span className="text-xs text-amber-600/60 dark:text-amber-500/50 hidden sm:inline-block">今天的 AI，只做一件你該知道的事</span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                            {insightItem.title}
                        </h3>

                        <div className="flex items-center gap-4 mt-4">
                            <Link
                                href={`/news/${insightItem.slug || insightItem.id}`}
                                className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold hover:gap-3 transition-all group-hover:underline decoration-2 underline-offset-4"
                            >
                                看今天的重點
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
