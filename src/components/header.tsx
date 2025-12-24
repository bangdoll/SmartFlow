'use client';

import { Suspense, useState } from 'react';
import { Waves, TrendingUp, Clock, Bookmark, User, Menu, X, CalendarDays, FileText } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/trends', icon: TrendingUp, labelKey: 'nav.trends' },
        { href: '/weekly', icon: CalendarDays, labelKey: 'nav.weekly' },
        { href: '/archive', icon: Clock, labelKey: 'nav.archive' },
        { href: '/bookmarks', icon: Bookmark, labelKey: 'nav.bookmarks' },
        { href: '/guide', icon: FileText, labelKey: 'nav.guide' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                    {/* Logo */}
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
                        {/* Desktop: Text Links */}
                        {navLinks.slice(0, 4).map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="hidden md:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[4rem] relative z-[102]"
                                title={t(link.labelKey)}
                            >
                                <span suppressHydrationWarning>{t(link.labelKey)}</span>
                            </a>
                        ))}

                        {/* Icon buttons */}
                        <div className="flex items-center gap-1 ml-1 sm:ml-2 flex-shrink-0 relative z-[102]">
                            <Suspense fallback={<div className="w-8 h-8" />}>
                                <div className="hidden sm:block">
                                    <SearchInput />
                                </div>
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
                                    <a href="/bookmarks" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <Bookmark className="w-4 h-4" />
                                        {t('nav.bookmarks')}
                                    </a>
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
                                    {language === 'zh-TW' ? '5分鐘掌握風險' : 'Catch AI Risks'}
                                </button>

                                {/* Mobile User Icon */}
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                                    title={language === 'zh-TW' ? '免費訂閱' : 'Subscribe Free'}
                                >
                                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </nav>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[200] md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-[201] transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
                    }`}
            >
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {language === 'zh-TW' ? '選單' : 'Menu'}
                    </span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all z-[202] relative"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Menu Links */}
                <nav className="p-4 space-y-2">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Icon className="w-5 h-5" />
                                <span suppressHydrationWarning>{t(link.labelKey)}</span>
                            </a>
                        );
                    })}
                </nav>

                {/* Search in Mobile Menu */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
                        <SearchInput />
                    </Suspense>
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}
