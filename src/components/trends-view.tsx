'use client';

import { useLanguage } from '@/components/language-context';
import { Zap, TrendingUp, Hash } from 'lucide-react';
import Link from 'next/link';

interface TrendItem {
    tag: string;
    count: number;
    title: string;
    desc: string;
    signal: string;
}

interface TrendsData {
    title: string;
    coreMessage: string;
    trends: TrendItem[];
    advice: {
        general: string;
        employee: string;
        boss: string;
    };
}

interface InitialTrendsData {
    title?: string | null;
    titleEn?: string | null;
    core_message?: string | null;
    coreMessageEn?: string | null;
    trends?: TrendItem[];
    persona_advice?: Partial<TrendsData['advice']> | null;
    personaAdviceEn?: Partial<TrendsData['advice']> | null;
}

const STATIC_TRENDS: Record<'en' | 'zh-TW', TrendsData> = {
    'zh-TW': {
        title: "這週 AI 世界，真正在往哪裡走？",
        coreMessage: "AI 已正式進入「現實摩擦期」：<br />問題不再是能不能做，而是誰該負責、誰要承擔後果。",
        trends: [
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
        ],
        advice: {
            general: "留意 AI 出錯、隱私與「無法關閉」的產品整合案例",
            employee: "注意 AI 是否開始重塑工作流程，而不只是提高效率",
            boss: "請正視 AI 導入後的責任歸屬與風險外溢問題"
        }
    },
    'en': {
        title: "Where is the AI World Actually Heading This Week?",
        coreMessage: "AI has entered the 'Reality Friction' phase:<br />The question is no longer capability, but accountability and consequence.",
        trends: [
            {
                tag: 'AI',
                count: 35,
                title: 'AI Enters Daily Systems: Errors and Risks Under Microscope',
                desc: 'Massive focus on deployment issues: hallucinations, data deletion, privacy disputes, and non-optional system integrations.',
                signal: 'AI is no longer just a "bonus tool"; it is a foundational capability that must be governed.'
            },
            {
                tag: 'Innovation',
                count: 15,
                title: 'Innovation Accelerates, But Pricing of Mistakes Rises',
                desc: 'News shifts from breakthroughs to costs of wrong bets and forced workflow reconstruction.',
                signal: 'The differentiator is no longer speed of innovation, but quality of decision.'
            },
            {
                tag: 'Google',
                count: 12,
                title: 'Major Platforms Pivot Strategies: Structural UX Changes Ahead',
                desc: 'Google trends reflect reconfigured AI features, data handling, and user interaction models.',
                signal: 'Expect the tools you use to silently change their operating logic within 6 months.'
            },
            {
                tag: 'OpenAI',
                count: 10,
                title: 'Capabilities Grow, Governance Pressure Mounts',
                desc: 'Updates focus not just on models, but stability, error costs, and usage boundaries.',
                signal: 'Capability is not the bottleneck; safe and reliable usage is the new barrier.'
            },
            {
                tag: 'Apple',
                count: 7,
                title: 'AI Embedded in Hardware: Harder to "Opt-Out"',
                desc: 'Apple news indicates AI moving from "optional feature" to "default existence".',
                signal: 'Future debate shifts from "is it useful" to "can I refuse it?".'
            },
            {
                tag: 'Ethics',
                count: 5,
                title: 'Ethics Heats Up: Usually Means Someone Got Hurt',
                desc: 'Ethics news is rarely predictive; it is usually post-mortem.',
                signal: 'When Ethics trends, technology has crossed the safety buffer.'
            }
        ],
        advice: {
            general: "Watch for AI errors, privacy, and 'un-closable' product integrations.",
            employee: "Notice if AI is reshaping workflows, not just boosting efficiency.",
            boss: "Face the responsibility and spillover risks of AI adoption."
        }
    }
};

export function TrendsView({ initialData }: { initialData: InitialTrendsData | null }) {
    const { language, t } = useLanguage();

    // Determine data source: Priority to DB (initialData), fallback to Static (though Static might be stale)
    const activeData: TrendsData = initialData ? {
        title: (language === 'en' && initialData.titleEn) ? initialData.titleEn : initialData.title || '',
        coreMessage: (language === 'en' && initialData.coreMessageEn) ? initialData.coreMessageEn : initialData.core_message || '',
        trends: initialData.trends || [],
        advice: (language === 'en' && initialData.personaAdviceEn) ? {
            general: initialData.personaAdviceEn.general || '',
            employee: initialData.personaAdviceEn.employee || '',
            boss: initialData.personaAdviceEn.boss || '',
        } : {
            general: initialData.persona_advice?.general || '',
            employee: initialData.persona_advice?.employee || '',
            boss: initialData.persona_advice?.boss || '',
        }
    } : (STATIC_TRENDS[language] || STATIC_TRENDS['zh-TW']);

    // Safety check for advice object structure if coming from DB (DB uses general/employee/boss keys)
    const advice = activeData.advice;

    // Alias to match existing JSX usage
    const data = {
        ...activeData,
        advice: advice
    };

    return (
        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-24">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                    {data.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                    {t('trends.subtitle')}
                </p>
            </div>

            {/* 1. Weekly Core Message */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 mb-8 md:mb-12 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 text-blue-100 font-bold tracking-wider text-sm uppercase">
                        <Zap className="w-4 h-4" />
                        {language === 'zh-TW' ? '本週智流一句話' : 'Weekly Insight'}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-4">
                        {data.coreMessage.split(/<br\s*\/?>(?:\s*)/i).map((line, index) => (
                            <span key={`${index}-${line}`}>
                                {index > 0 && <br />}
                                {line}
                            </span>
                        ))}
                    </h2>

                    <p className="text-blue-50 text-lg leading-relaxed opacity-90">
                        * {language === 'zh-TW' ? '這一頁每週一更新，幫你校準方向。' : 'Updated every Monday to calibrate your direction.'}
                    </p>
                </div>
            </div>

            {/* 2. Keyword Trends with Interpretation */}
            <div className="grid gap-4 md:gap-6 mb-12 md:mb-16">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-gray-500" />
                    {language === 'zh-TW' ? '本週關鍵趨勢解讀' : 'Key Trends Implementation'}
                </h2>
                {data.trends.map((item: TrendItem, index: number) => (
                    <Link
                        key={item.tag}
                        href={`/archive?tag=${encodeURIComponent(item.tag)}`}
                        className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-5 md:p-6 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group cursor-pointer relative overflow-hidden"
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
                                <span className="text-xs text-gray-500 dark:text-gray-400">{language === 'zh-TW' ? '則' : ' articles'}</span>
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
                                    <strong>{language === 'zh-TW' ? '訊號解讀：' : 'Signal: '}</strong>{item.signal}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* 3. Persona Advice Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 mb-12">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    🎯 {language === 'zh-TW' ? '如果你是不同角色，這週該關注什麼？' : 'Actionable Advice by Role'}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            👤 {language === 'zh-TW' ? '一般使用者' : 'User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            👉 {data.advice.general}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            💼 {language === 'zh-TW' ? '上班族' : 'Employee'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            👉 {data.advice.employee}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            👑 {language === 'zh-TW' ? '主管或老闆' : 'Leader'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            👉 {data.advice.boss}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-12 text-gray-500 dark:text-gray-500 text-sm">
                <p className="mb-2">{language === 'zh-TW' ? '這一頁每週都會更新。' : 'Updated Weekly.'}</p>
                <p>{language === 'zh-TW' ? '如果你想知道「AI 世界正在累積什麼改變」，下週同一時間，再回來看一次就夠了。' : 'Check back next week to track the cumulative changes in the AI world.'}</p>
            </div>
        </div>
    );
}
