'use client';

import { useLanguage } from './language-context';
import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function FeedSubscribeCard() {
    const { t } = useLanguage();

    const scrollToSubscribe = () => {
        const section = document.getElementById('subscribe');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 my-8 text-center shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('feed.subscribe.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                {t('feed.subscribe.subtitle')}
            </p>
            <button
                onClick={scrollToSubscribe}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-bold text-sm sm:text-base hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
            >
                <Mail className="w-4 h-4" />
                {t('feed.subscribe.action')}
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}
