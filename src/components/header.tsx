'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Waves, TrendingUp, Clock, Bookmark, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchInput } from '@/components/search-input';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-context';
import { useUser } from '@/components/user-provider';
import { AuthModal } from '@/components/auth-modal';

export function Header() {
    const { t, language } = useLanguage();
    const { user, signOut } = useUser();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Quick fix for mobile menu state if needed later, but focusing on auth now

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                    {/* Logo - simplified on mobile */}
                    <a href="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 py-2 relative z-50">
                        <div className="bg-black dark:bg-white text-white dark:text-black p-1 sm:p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
                            <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 whitespace-nowrap">
                            <span className="sm:hidden" suppressHydrationWarning>
                                {language === 'zh-TW' ? '智流' : 'Smart Flow'}
                            </span>
                            <span className="hidden sm:inline" suppressHydrationWarning>
                                {language === 'zh-TW' ? '智流 Smart Flow' : 'Smart Flow'}
                            </span>
                        </h1>
                    </a>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1 sm:gap-2 relative z-[101]">
                        {/* Mobile: Trends Icon */}
                        <a
                            href="/trends"
                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all md:hidden active:scale-95 relative z-[102]"
                            title={t('nav.trends')}
                        >
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </a>

                        {/* Mobile: Archive Icon */}
                        <a
                            href="/archive"
                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all md:hidden active:scale-95 relative z-[102]"
                            title={t('nav.archive')}
                        >
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </a>

                        {/* Mobile: Bookmarks Icon */}
                        <Link
                            href="/bookmarks"
                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all md:hidden active:scale-95 relative z-[102]"
                            title={t('nav.bookmarks')}
                        >
                            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />
                        </Link>

                        {/* Desktop: Trends Text */}
                        <a
                            href="/trends"
                            className="hidden md:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[4rem] relative z-[102]"
                            title={t('nav.trends')}
                        >
                            <span suppressHydrationWarning>{t('nav.trends')}</span>
                        </a>

                        {/* Desktop: Archive Text */}
                        <a
                            href="/archive"
                            className="hidden md:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[4rem] relative z-[102]"
                            title={t('nav.archive')}
                        >
                            <span suppressHydrationWarning>{t('nav.archive')}</span>
                        </a>

                        {/* Desktop: Bookmarks Text */}
                        <Link
                            href="/bookmarks"
                            className="hidden md:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[4rem] relative z-[102]"
                            title={t('nav.bookmarks')}
                        >
                            <span suppressHydrationWarning>{t('nav.bookmarks')}</span>
                        </Link>

                        {/* Icon buttons */}
                        <div className="flex items-center gap-0.5 sm:gap-1 ml-1 relative z-[102]">
                            <Suspense fallback={<div className="w-8 h-8" />}>
                                <SearchInput />
                            </Suspense>
                            <ThemeToggle />
                            <LanguageToggle />
                        </div>

                        {/* Divider */}
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

                        {/* Auth / Subscribe */}
                        {user ? (
                            <div className="relative group z-[102]">
                                <button className="flex items-center gap-2 pl-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                                        <img
                                            src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email || 'User'}`}
                                            alt="User"
                                            className="w-full h-full rounded-full border-2 border-white dark:border-black object-cover"
                                        />
                                    </div>
                                </button>
                                {/* Dropdown */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user.user_metadata.full_name || user.email}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <Link href="/bookmarks" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <Bookmark className="w-4 h-4" />
                                        {t('nav.bookmarks')}
                                    </Link>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 relative z-[102]">
                                {/* Desktop Button */}
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="hidden lg:inline-flex bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap"
                                >
                                    {language === 'zh-TW' ? '免費註冊' : 'Sign Up'}
                                </button>

                                {/* Mobile User Icon */}
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                                    title={language === 'zh-TW' ? '登入/註冊' : 'Sign Up / Log In'}
                                >
                                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}
