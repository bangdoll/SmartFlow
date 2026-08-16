import { useState, useEffect, useMemo, useRef } from 'react';
import { NewsItem } from '@/types';
import { useLanguage } from '@/components/language-context';

export function useBatchTranslation(items: NewsItem[]) {
    const { language } = useLanguage();
    const [translations, setTranslations] = useState<Record<string, { title_en?: string; summary_en?: string }>>({});
    const translatingIds = useRef(new Set<string>());

    useEffect(() => {
        if (language !== 'en') return;

        const itemsToTranslate = items.filter(item => {
            const hasEn = item.title_en || translations[item.id]?.title_en;
            return !hasEn && !translatingIds.current.has(item.id);
        });

        if (itemsToTranslate.length === 0) return;

        const ids = itemsToTranslate.map(i => i.id);

        ids.forEach(id => translatingIds.current.add(id));

        // Fetch translations
        void fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
            .then(async res => {
                if (!res.ok) throw new Error('Translation request failed');
                return res.json() as Promise<{ results?: Array<{ id: string; title_en?: string; summary_en?: string }> }>;
            })
            .then(data => {
                if (data.results) {
                    setTranslations(prev => {
                        const next = { ...prev };
                        data.results?.forEach(res => {
                            if (res.title_en) {
                                next[res.id] = {
                                    title_en: res.title_en,
                                    summary_en: res.summary_en
                                };
                            }
                        });
                        return next;
                    });
                }
            })
            .catch(err => console.error('Batch translation error:', err))
            .finally(() => ids.forEach(id => translatingIds.current.delete(id)));

    }, [language, items, translations]);

    // Merge logic
    const mergedItems = useMemo(() => {
        return items.map(item => {
            const trans = translations[item.id];
            if (trans) {
                return { ...item, ...trans };
            }
            return item;
        });
    }, [items, translations]);

    return mergedItems;
}
