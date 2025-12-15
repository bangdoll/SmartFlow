import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { Zap, TrendingUp, Hash } from 'lucide-react';
import Link from 'next/link';

async function getTrends() {
    // 雖然有 API，但在 Server Component 直接呼叫 DB 更快且不需 fetch localhost
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: items } = await supabase
        .from('news_items')
        .select('tags')
        .gte('published_at', sevenDaysAgo.toISOString());

    const tagCounts: Record<string, number> = {};
    items?.forEach(item => {
        const tags = item.tags as string[] | null;
        tags?.forEach((tag: string) => {
            const normalizedTag = tag.trim();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

const weeklyCuratedTrends = [
    {
        tag: 'AI',
        count: 35,
        title: 'AI 已全面進入日常系統，錯誤與風險開始被放大檢視',
        desc: '本週大量新聞聚焦在 AI 實際部署後的問題：誤判、資料刪除、隱私爭議、不可關閉的系統整合。',
        signal: 'AI 不再只是「加分工具」，而是成為必須被治理的基礎能力。'
    },
    {
        tag: 'Innovation',
        count: 15,
        title: '創新仍在加速，但企業開始承受選錯方向的代價',
        desc: '創新相關新聞不再只談突破，而是開始出現「投入後無法回收」、「流程被迫重構」的案例。',
        signal: '接下來拉開差距的，不是創新速度，而是決策品質。'
    },
    {
        tag: 'Google',
        count: 12,
        title: '大型平台調整 AI 策略，產品體驗即將出現結構性改變',
        desc: 'Google 本週頻繁出現在趨勢中，反映出大型平台正在重新配置 AI 功能、資料與使用者互動方式。',
        signal: '這通常意味著：你半年內習慣的工具，會悄悄換一種運作邏輯。'
    },
    {
        tag: 'OpenAI',
        count: 10,
        title: '能力持續推進，但治理與可靠性壓力同步升高',
        desc: '相關新聞不只談模型升級，也開始集中在服務穩定性、錯誤成本與使用邊界。',
        signal: 'AI 能力已不是瓶頸，如何安全使用，正在成為新門檻。'
    },
    {
        tag: 'Apple',
        count: 7,
        title: 'AI 正被嵌入硬體與系統層，使用者將更難「選擇不用」',
        desc: 'Apple 相關新聞顯示，AI 正從「功能選項」轉為「預設存在」。',
        signal: '未來的討論焦點，會從「好不好用」轉向「能不能拒絕、能否掌控」。'
    },
    {
        tag: 'Ethics',
        count: 5,
        title: '倫理議題升溫，通常代表「已經有人受傷」',
        desc: '倫理相關新聞往往不是預測，而是事後檢討。',
        signal: '當倫理成為趨勢關鍵字，代表技術已跨過安全緩衝區。'
    }
];

export default async function TrendsPage() {
    // In the future, we can merge dynamic DB trends with curated insights.
    // const trends = await getTrends(); 

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Header />

            <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                        這週 AI 世界，真正在往哪裡走？
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        我們從過去 7 天的全球 AI 新聞中，<br className="hidden md:inline" />
                        幫你整理出<strong>正在放大、且已開始影響現實決策的關鍵方向</strong>。
                    </p>
                </div>

                {/* 1. Weekly Core Message */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-12 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-blue-100 font-bold tracking-wider text-sm uppercase">
                            <Zap className="w-4 h-4" />
                            本週智流一句話
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-4">
                            AI 已正式進入「現實摩擦期」：<br />
                            問題不再是能不能做，而是誰該負責、誰要承擔後果。
                        </h2>
                        <p className="text-blue-50 text-lg leading-relaxed opacity-90">
                            這一週的新聞焦點，明顯從模型能力與創新展示，<br className="hidden md:inline" />
                            轉向 <strong>產品整合、使用風險、組織責任與社會影響</strong>。
                        </p>
                    </div>
                </div>

                {/* 2. Keyword Trends with Interpretation */}
                <div className="grid gap-6 mb-16">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-gray-500" />
                        本週關鍵趨勢解讀
                    </h2>
                    {weeklyCuratedTrends.map((item, index) => (
                        <Link
                            key={item.tag}
                            href={`/archive?tag=${encodeURIComponent(item.tag)}`}
                            className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-gray-400 pointer-events-none">
                                {index + 1}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2.5 py-0.5 rounded text-sm font-bold ${index < 3
                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.tag}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.count}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">則</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                    👉 {item.title}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {item.desc}
                                </p>

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        <span className="mr-2">📡</span>
                                        <strong>訊號解讀：</strong>{item.signal}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 3. Persona Advice Section */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 mb-12">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        🎯 如果你是不同角色，這週該關注什麼？
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                👤 一般使用者
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                👉 留意 AI 出錯、隱私與「無法關閉」的產品整合案例
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                💼 上班族
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                👉 注意 AI 是否開始重塑工作流程，而不只是提高效率
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                👑 主管或老闆
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                👉 請正視 AI 導入後的責任歸屬與風險外溢問題
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center mt-12 text-gray-500 dark:text-gray-500 text-sm">
                    <p className="mb-2">這一頁每週都會更新。</p>
                    <p>如果你想知道「AI 世界正在累積什麼改變」，下週同一時間，再回來看一次就夠了。</p>
                </div>
            </div>
        </main >
    );
}
