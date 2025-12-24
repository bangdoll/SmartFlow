'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-context';

interface ComparisonData {
    t1: string;
    t2: string;
    desc: string;
    descEn: string;
    count1: number;
    count2: number;
}

interface CompareListProps {
    comparisons: ComparisonData[];
}

export function CompareList({ comparisons }: CompareListProps) {
    const { t, language } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {language === 'en' ? 'AI Comparison Analysis' : 'AI 比較分析'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {language === 'en'
                        ? 'Compare AI companies and products to understand industry competition'
                        : '深入比較各 AI 公司和產品的最新發展趨勢，了解產業競爭動態'}
                </p>
            </div>

            {comparisons.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {language === 'en' ? 'No comparison data available' : '目前尚無足夠資料進行比較分析'}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {comparisons.map(({ t1, t2, desc, descEn, count1, count2 }) => (
                        <Link
                            key={`${t1}-${t2}`}
                            href={`/compare/${t1.toLowerCase().replace(/\s+/g, '-')}-vs-${t2.toLowerCase().replace(/\s+/g, '-')}`}
                            className="group p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{t1}</span>
                                <span className="text-gray-400 text-sm">vs</span>
                                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{t2}</span>
                            </div>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {language === 'en' ? descEn : desc}
                            </p>
                            <p className="text-center text-xs text-gray-400">
                                {count1} vs {count2} {language === 'en' ? 'articles' : '則報導'}
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {/* SEO Content */}
            <div className="mt-16 prose prose-lg dark:prose-invert max-w-none">
                <h2>{language === 'en' ? 'Why Compare AI Companies?' : '為什麼要比較 AI 公司？'}</h2>
                <p>
                    {language === 'en'
                        ? 'As AI develops rapidly, understanding the differences between AI companies and products has become crucial. Whether you\'re a developer, business decision-maker, or AI enthusiast, staying updated on the latest from OpenAI, Anthropic, Google, Meta, and other tech giants helps you make smarter technology choices and investment decisions.'
                        : '隨著人工智慧快速發展，了解各 AI 公司和產品的差異變得至關重要。無論您是開發者、企業決策者還是 AI 愛好者，掌握 OpenAI、Anthropic、Google、Meta 等科技巨頭的最新動態，都能幫助您做出更明智的技術選擇和投資決策。'}
                </p>
                <h2>{language === 'en' ? 'Our Comparison Method' : '我們的比較方法'}</h2>
                <p>
                    {language === 'en'
                        ? 'Smart Flow tracks daily AI news to automatically analyze each company and product\'s media coverage, development trends, and latest updates. Our comparison analysis helps you quickly understand market dynamics without spending hours reading news every day.'
                        : 'Smart Flow 透過追蹤每日 AI 新聞報導，自動分析各公司和產品的媒體聲量、發展趨勢和最新動態。我們的比較分析幫助您快速了解市場動態，而無需每天花費大量時間閱讀新聞。'}
                </p>
            </div>
        </div>
    );
}
