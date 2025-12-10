'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync state with URL
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && q !== query) {
            // eslint-disable-next-line
            setQuery(q);
            setIsOpen(true);
        }
    }, [searchParams, query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle click outside to close (if empty)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (!query) {
                    setIsOpen(false);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setIsOpen(false);
        if (window.location.pathname === '/search') {
            router.push('/');
        }
    };

    return (
        <div ref={containerRef} className={`relative flex items-center transition-all duration-300 ${isOpen ? 'w-full sm:w-64' : 'w-10'}`}>
            {isOpen ? (
                <form onSubmit={handleSearch} className="relative w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜尋新聞..."
                        className="w-full h-10 pl-10 pr-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </form>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="開啟搜尋"
                >
                    <Search className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
