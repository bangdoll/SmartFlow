import { useState, useEffect, useMemo } from 'react';
import { NewsItem } from '@/types';
import { useLanguage } from '@/components/language-context';

export function useBatchTranslation(items: NewsItem[]) {
    const { language } = useLanguage();
    const [translations, setTranslations] = useState<Record<string, { title_en?: string; summary_en?: string }>>({});
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (language !== 'en') {
            setTranslatingIds(new Set());
            return;
        }

        const itemsToTranslate = items.filter(item => {
            const hasEn = item.title_en || translations[item.id]?.title_en;
            return !hasEn && !translatingIds.has(item.id);
        });

        if (itemsToTranslate.length === 0) return;

        const ids = itemsToTranslate.map(i => i.id);

        // Mark as translating
        setTranslatingIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });

        // Fetch translations
        fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    setTranslations(prev => {
                        const next = { ...prev };
                        data.results.forEach((res: any) => {
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
            .finally(() => {
                setTranslatingIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            });

    }, [language, items, translations, translatingIds]);
    // Note: 'items' dependency might cause loop if items change frequently, but here items usually stable or append.
    // 'translations' dependency ensures we don't re-fetch if we just updated.

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
