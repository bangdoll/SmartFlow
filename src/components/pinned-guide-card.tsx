'use client';

import Link from 'next/link';
import { useLanguage } from './language-context';
import { Pin, ArrowRight } from 'lucide-react';

export function PinnedGuideCard() {
    const { t } = useLanguage();

    return (
        <div className="mb-8">
            <Link href="/guide" className="block group">
                <div className="relative bg-white dark:bg-gray-900 border-l-4 border-blue-500 rounded-r-xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Pin className="w-4 h-4 text-blue-500 fill-blue-500" />
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {t('guide.label')}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {t('guide.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {t('guide.desc')}
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
