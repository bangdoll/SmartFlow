import { Header } from '@/components/header';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Volume2, MessageSquare, Mail } from 'lucide-react';

export const metadata = {
    title: '新手指南 | 智流 Smart Flow',
    description: '如何使用智流 Smart Flow 掌握每日科技趨勢的完整教學。',
};

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <Header />

            <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    返回首頁
                </Link>

                <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-10">
                    <div className="text-center mb-10">
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">
                            新手教學
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                            ✨ 如何使用《智流》掌握每日科技趨勢
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            專為忙碌現代人設計。不懂 AI 術語？沒關係，這裡就是您的科技白話報紙。
                        </p>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/20 mb-10">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-300 mt-0">
                                <span className="flex items-center justify-center w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full text-sm">1</span>
                                首頁：三步驟輕鬆上手
                            </h2>
                            <p>一進入網站，跟著歡迎區塊的 1-2-3 步驟做就好：</p>
                            <ol className="list-decimal pl-5 space-y-2 marker:text-blue-500">
                                <li><strong>打開網站</strong>：您已經在這裡了！</li>
                                <li><strong>往下滑</strong>：瀏覽最新的新聞卡片。</li>
                                <li><strong>點選新聞</strong>：點內容進去閱讀。</li>
                            </ol>
                            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                                <img src="/images/guide/welcome.png" alt="首頁歡迎區塊" className="w-full" />
                            </div>
                        </div>

                        <div className="mb-12">
                            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                                瀏覽最新動態
                            </h2>
                            <p>
                                我們幫您把落落長的英文新聞，整理成 <strong>中文標題</strong> 與 <strong>簡短摘要</strong>。
                                每一張新聞卡片都會清楚標示來源（如 TechCrunch）與關鍵字標籤，讓您一眼就能決定要不要讀。
                            </p>
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md my-6">
                                <img src="/images/guide/feed.png" alt="新聞列表" className="w-full" />
                            </div>
                        </div>

                        <div className="mb-12">
                            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                <Volume2 className="w-6 h-6 text-gray-400" />
                                聆聽與互動 (AI 導讀)
                            </h2>
                            <p>
                                點進任何一則新聞，您會看到這兩個強大功能，適合通勤或做家事時使用：
                            </p>
                            <ul className="space-y-4 my-6">
                                <li className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                        <Volume2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <strong>🎧 聆聽 AI 導讀</strong>
                                        <p className="text-sm text-gray-500 m-0">按下藍色的播放鍵，AI 會用自然的語音唸新聞摘要給您聽。</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <strong>💬 AI 導讀助手</strong>
                                        <p className="text-sm text-gray-500 m-0">對話視窗隨時待命。覺得新聞太難懂？直接問它：「這跟一般人有什麼關係？」</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                                <img src="/images/guide/detail.png" alt="新聞詳細頁與導讀" className="w-full" />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mt-0">
                                <Mail className="w-6 h-6 text-gray-400" />
                                每日送到家 (免費訂閱)
                            </h2>
                            <p>
                                覺得每天自己開網站很麻煩？滑到首頁最下方，輸入 Email。
                                我們每天早上 8 點準時寄送 <strong>「今日重點摘要」</strong> 給您。
                            </p>
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md mt-4">
                                <img src="/images/guide/subscribe.png" alt="訂閱表單" className="w-full" />
                            </div>
                        </div>

                    </div>

                    <div className="mt-12 text-center pt-8 border-t border-gray-100 dark:border-gray-800">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                        >
                            開始閱讀新聞
                        </Link>
                    </div>
                </article>
            </main>
        </div>
    );
}
