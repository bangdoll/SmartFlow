import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI 比較分析 | OpenAI vs Anthropic, ChatGPT vs Claude',
    description: '深入比較各 AI 公司和產品的最新發展、新聞報導和市場動態。了解 OpenAI、Anthropic、Google、Meta 等科技巨頭在 AI 領域的競爭與差異。',
    keywords: ['AI 比較', 'OpenAI vs Anthropic', 'ChatGPT vs Claude', 'GPT-4 vs Gemini', 'AI 競爭'],
};

// 熱門比較組合
const COMPARISONS = [
    { t1: 'OpenAI', t2: 'Anthropic', desc: 'AGI 路線之爭' },
    { t1: 'ChatGPT', t2: 'Claude', desc: '對話 AI 之巔' },
    { t1: 'GPT-4', t2: 'Gemini', desc: '旗艦模型對決' },
    { t1: 'Midjourney', t2: 'DALL-E', desc: '圖像生成王者' },
    { t1: 'Microsoft', t2: 'Google', desc: 'AI 巨頭之爭' },
    { t1: 'Meta', t2: 'Google', desc: '開源 vs 閉源' },
    { t1: 'Sora', t2: 'Runway', desc: '影片生成新戰場' },
    { t1: 'TSMC', t2: 'NVIDIA', desc: 'AI 晶片供應鏈' },
];

export default function CompareIndexPage() {
    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    AI 比較分析
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    深入比較各 AI 公司和產品的最新發展趨勢，了解產業競爭動態
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {COMPARISONS.map(({ t1, t2, desc }) => (
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
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            {desc}
                        </p>
                    </Link>
                ))}
            </div>

            {/* SEO Content */}
            <div className="mt-16 prose prose-lg dark:prose-invert max-w-none">
                <h2>為什麼要比較 AI 公司？</h2>
                <p>
                    隨著人工智慧快速發展，了解各 AI 公司和產品的差異變得至關重要。
                    無論您是開發者、企業決策者還是 AI 愛好者，掌握 OpenAI、Anthropic、Google、Meta 等科技巨頭的最新動態，
                    都能幫助您做出更明智的技術選擇和投資決策。
                </p>
                <h2>我們的比較方法</h2>
                <p>
                    Smart Flow 透過追蹤每日 AI 新聞報導，自動分析各公司和產品的媒體聲量、發展趨勢和最新動態。
                    我們的比較分析幫助您快速了解市場動態，而無需每天花費大量時間閱讀新聞。
                </p>
            </div>
        </div>
    );
}
