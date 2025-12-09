import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function Header() {
    return (
        <header className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md sticky top-0 z-50 transition-colors supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-gray-950/50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white group">
                    <div className="relative w-10 h-10 transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Smart Flow Logo"
                            fill
                            className="object-contain mix-blend-multiply dark:mix-blend-screen dark:invert"
                            priority
                        />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent text-2xl">智流 Smart Flow</span>
                </a>

                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                            最新動態
                        </Link>
                        <Link href="/archive" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                            歷史摘要
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/#subscribe" className="hidden md:inline-flex bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                            訂閱電子報
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
