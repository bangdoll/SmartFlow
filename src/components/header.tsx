'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Waves, TrendingUp, Clock } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchInput } from '@/components/search-input';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-context';

export function Header() {
    const { t, language } = useLanguage();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                {/* Logo - simplified on mobile */}
                <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 py-2 relative z-50">
                    <div className="bg-black dark:bg-white text-white dark:text-black p-1 sm:p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
                        <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 whitespace-nowrap">
                        <span className="sm:hidden">Smart Flow</span>
                        <span className="hidden sm:inline">Smart Flow</span>
                    </h1>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 sm:gap-3 relative z-40">
                    {/* Trends - Icon on mobile, Text on desktop */}
                    {/* Trends - Icon on mobile, Text on desktop */}
                    <Link
                        href="/trends"
                        className="p-3 sm:p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors active:scale-95"
                        title={t('nav.trends')}
                    >
                        <div className="p-2 md:hidden">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="hidden md:flex text-sm font-medium px-3 py-2 min-w-[4rem] justify-center items-center">{t('nav.trends')}</span>
                    </Link>

                    {/* Archive - Icon on mobile, Text on desktop */}
                    <Link
                        href="/archive"
                        className="p-3 sm:p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors active:scale-95 md:hidden"
                        title={t('nav.archive')}
                    >
                        <div className="p-2">
                            <Clock className="w-6 h-6" />
                        </div>
                    </Link>

                    {/* Desktop-only Archive Text */}
                    <Link href="/archive" className="hidden md:flex text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors px-3 py-2 min-w-[4rem] justify-center items-center">
                        {t('nav.archive')}
                    </Link>

                    {/* Icon buttons - always visible but compact on mobile */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <Suspense fallback={<div className="w-8 h-8" />}>
                            <SearchInput />
                        </Suspense>
                        <ThemeToggle />
                        <LanguageToggle />
                    </div>

                    {/* Subscribe button - desktop only */}
                    <Link href="/#subscribe" className="hidden lg:inline-flex bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap">
                        {t('nav.subscribe')}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
