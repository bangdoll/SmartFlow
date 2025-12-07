import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export function Header() {
    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <Newspaper className="w-6 h-6" />
                    <span>智流 Smart Flow</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
                        最新動態
                    </Link>
                    <Link href="/archive" className="text-gray-600 hover:text-gray-900 font-medium">
                        歷史摘要
                    </Link>
                    <Link href="/#subscribe" className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors">
                        訂閱電子報
                    </Link>
                </nav>
            </div>
        </header>
    );
}
