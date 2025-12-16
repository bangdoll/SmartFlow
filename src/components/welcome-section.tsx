'use client';

import Link from 'next/link';
import { useLanguage } from './language-context';
import { ArrowDown } from 'lucide-react';

export function WelcomeSection() {
    const { t } = useLanguage();

    const handleScrollToNext = () => {
        // Scroll to news feed or daily insight
        const feed = document.getElementById('daily-insight') || document.getElementById('news-feed');
        if (feed) {
            feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-blue-100 dark:border-blue-900/30 rounded-2xl p-8 md:p-10 shadow-xl max-w-3xl mx-auto mb-12 text-center">

            {/* Problem & Solution */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium">
                {t('hero.subtitle')}
            </p>

            {/* Primary One Action */}
            <button
                onClick={handleScrollToNext}
                className="inline-flex flex-col items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 group"
            >
                <div className="flex items-center gap-2">
                    {t('hero.action')}
                </div>
                {/* Micro-copy or arrow if needed */}
                <ArrowDown className="w-5 h-5 mt-1 animate-bounce opacity-80" />
            </button>

        </div>
    );
}
