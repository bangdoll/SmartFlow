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

export default async function TrendsPage() {
    const trends = await getTrends();

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
                        幫你整理出<strong>正在變大、不能忽略的重點方向</strong>。
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
                        <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-2">
                            這週的 AI 新聞很多，但核心只有一件事：<br />
                            AI 正從「炫技階段」，正式進入「現實摩擦期」。
                        </h2>
                        <p className="text-blue-100 mt-4 text-sm opacity-80">
                            * 這一頁每週日更新，幫你校準方向。
                        </p>
                    </div>
                </div>

                {/* 2. Keyword Trends with Interpretation Placeholder */}
                <div className="grid gap-6 mb-16">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-gray-500" />
                        本週關鍵趨勢解讀
                    </h2>
                    {trends.map((item, index) => (
                        <Link
                            key={item.tag}
                            href={`/archive?tag=${encodeURIComponent(item.tag)}`}
                            className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:scale-[1.01] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group cursor-pointer gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg flex-shrink-0 ${index < 3
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                        {item.tag}
                                    </h3>
                                    {/* Mock Interpretation - In future this comes from DB */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        👉 <span className="font-medium text-gray-900 dark:text-gray-200">這代表...</span> (點擊查看 {item.tag} 相關新聞)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full self-start sm:self-center">
                                <Zap className="w-4 h-4 text-blue-500" />
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {item.count}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">則新聞</span>
                            </div>
                        </Link>
                    ))}

                    {trends.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            目前沒有足夠的數據來顯示趨勢。
                        </div>
                    )}
                </div>


                {/* 3. Persona Advice Section */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        🎯 如果你是不同角色，這週該看什麼？
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">👤 一般使用者</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                👉 關注「AI 出錯、隱私、日常產品整合」相關新聞就好
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">💼 上班族</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                👉 注意「AI 開始影響工作流程，而不只是工具」
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">👑 主管或老闆</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                👉 別忽略「AI 導入後的風險與組織摩擦」
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
