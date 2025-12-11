'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchInput } from '@/components/search-input';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-context';

export function Header() {
    const { t } = useLanguage();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        智流 <span className="text-blue-600 dark:text-blue-400">Smart Flow</span>
                    </h1>
                </Link>

                <nav className="flex items-center gap-2 sm:gap-4">
                    <Link href="/trends" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        {t('nav.trends')}
                    </Link>
                    <Link href="/archive" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        {t('nav.archive')}
                    </Link>

                    <div className="flex items-center gap-2">
                        <Suspense fallback={<div className="w-10 h-10" />}>
                            <SearchInput />
                        </Suspense>
                        <ThemeToggle />
                        <LanguageToggle />
                        <Link href="/#subscribe" className="hidden md:inline-flex bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                            {t('nav.subscribe')}
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
