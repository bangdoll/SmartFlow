'use client';

import { NewsItem } from '@/types';
import { useLanguage } from '@/components/language-context';
import { BookOpen, Star, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface EssentialsViewProps {
    items: NewsItem[];
}

export function EssentialsView({ items }: EssentialsViewProps) {
    const { t, language } = useLanguage();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 按分類分組
    const groupedItems = items.reduce((acc, item) => {
        const category = item.tags?.[0] || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, NewsItem[]>);

    const categoryIcons: Record<string, React.ReactNode> = {
        'AI 基礎入門': <BookOpen className="w-5 h-5" />,
        'ChatGPT 與對話 AI': <Sparkles className="w-5 h-5" />,
        'AI 影像生成': <Star className="w-5 h-5" />,
        'AI 對企業的影響': <Lightbulb className="w-5 h-5" />,
    };

    const categoryColors: Record<string, string> = {
        'AI 基礎入門': 'from-blue-500 to-cyan-500',
        'ChatGPT 與對話 AI': 'from-purple-500 to-pink-500',
        'AI 影像生成': 'from-orange-500 to-red-500',
        'AI 對企業的影響': 'from-green-500 to-emerald-500',
        'AI 安全與倫理': 'from-yellow-500 to-amber-500',
        'AI 與程式開發': 'from-indigo-500 to-violet-500',
        'AI 硬體與晶片': 'from-gray-500 to-slate-500',
        'AI 最新突破': 'from-rose-500 to-pink-500',
    };

    // 分類名稱翻譯
    const categoryTranslations: Record<string, string> = {
        'AI 基礎入門': 'AI Fundamentals',
        'ChatGPT 與對話 AI': 'ChatGPT & Conversational AI',
        'AI 影像生成': 'AI Image Generation',
        'AI 對企業的影響': 'AI Impact on Business',
        'AI 安全與倫理': 'AI Safety & Ethics',
        'AI 與程式開發': 'AI & Software Development',
        'AI 硬體與晶片': 'AI Hardware & Chips',
        'AI 最新突破': 'Latest AI Breakthroughs',
    };

    const getCategoryName = (category: string) => {
        if (language === 'en') {
            return categoryTranslations[category] || category;
        }
        return category;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-4 py-2 rounded-full mb-4">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        {t('essentials.badge')}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('essentials.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {t('essentials.subtitle')}
                </p>
            </div>

            {/* Introduction Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    {t('essentials.howToUse')}
                </h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">1.</span>
                        {t('essentials.step1')}
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">2.</span>
                        {t('essentials.step2')}
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">3.</span>
                        {t('essentials.step3')}
                    </li>
                </ul>
            </div>

            {/* Categories */}
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColors[category] || 'from-gray-500 to-slate-500'} flex items-center justify-center text-white`}>
                            {categoryIcons[category] || <BookOpen className="w-5 h-5" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {getCategoryName(category)}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {categoryItems.length} {language === 'en' ? 'articles' : '篇文章'}
                        </span>
                    </div>

                    <div className="grid gap-4">
                        {categoryItems.map((item, index) => {
                            const displayTitle = (language === 'en' && item.title_en) ? item.title_en : item.title;
                            const displaySummary = (language === 'en' && item.summary_en) ? item.summary_en : item.summary_zh;

                            return (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.slug || item.id}`}
                                    className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${categoryColors[category] || 'from-gray-500 to-slate-500'} flex items-center justify-center text-white text-sm font-bold`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <span className="font-medium text-blue-600 dark:text-blue-400">{item.source}</span>
                                                <span>•</span>
                                                <span>{formatDate(item.published_at)}</span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {displayTitle}
                                            </h3>
                                            {displaySummary && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {displaySummary.substring(0, 150)}...
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                {t('essentials.readMore')}
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Empty State */}
            {items.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {t('essentials.noData')}
                </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                <h3 className="text-xl font-bold mb-2">
                    {t('essentials.ctaTitle')}
                </h3>
                <p className="text-blue-100 mb-4">
                    {t('essentials.ctaSubtitle')}
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                >
                    {t('essentials.ctaButton')}
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
