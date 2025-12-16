'use client';

import { useLanguage } from '@/components/language-context';

interface PageHeaderProps {
    titleKey: string;
    subtitleKey: string;
}

export function PageHeader({ titleKey, subtitleKey }: PageHeaderProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t(titleKey)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                {t(subtitleKey)}
            </p>
        </div>
    );
}
