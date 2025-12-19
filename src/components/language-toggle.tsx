'use client';

import { useTransition } from 'react';
import { useLanguage } from './language-context';

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();
    const [isPending, startTransition] = useTransition();

    const isEnglish = language === 'en';

    const toggleLanguage = () => {
        startTransition(() => {
            setLanguage(isEnglish ? 'zh-TW' : 'en');
        });
    };

    return (
        <button
            onClick={toggleLanguage}
            disabled={isPending}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs sm:text-sm ${isEnglish
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-red-50 text-red-600 hover:bg-red-100"
                } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
            title={isEnglish ? "Switch to Traditional Chinese" : "Switch to English"}
        >
            {isEnglish ? "中" : "EN"}
        </button>
    );
}
