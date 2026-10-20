'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-context';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const { language } = useLanguage();
    const english = language === 'en';

    return (
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
            <h1 className="mb-4 text-2xl font-bold">
                {english ? 'Content is temporarily unavailable' : '暫時無法載入內容'}
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                {english ? 'The data service is unavailable. Please try again later.' : '資料服務暫時無法使用，請稍後再試。'}
            </p>
            <button onClick={reset} className="rounded-lg bg-blue-600 px-5 py-2 text-white">
                {english ? 'Try again' : '重試'}
            </button>
            <Link href="/" className="ml-4 text-blue-600">
                {english ? 'Back to home' : '回首頁'}
            </Link>
        </main>
    );
}
