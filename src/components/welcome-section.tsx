import Link from 'next/link';
import { ArrowDown } from 'lucide-react';

export function WelcomeSection() {
    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto mb-12">

            {/* 歡迎標題區 */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    👋 歡迎來到《智流》
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    這裡每天幫你整理<strong>全世界最新的重要科技與 AI 新聞</strong>，<br className="hidden md:inline" />
                    不用搜尋、不用設定，<strong>打開就能看</strong>。
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200 font-medium flex items-start gap-2">
                        <span>👉</span>
                        <span>不懂 AI 也沒關係，把它當成一份「<strong>科技早報</strong>」就好。</span>
                    </p>
                </div>
            </div>

            {/* 使用教學區 */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    👀 怎麼用？很簡單
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold rounded-full flex-shrink-0">
                            1
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">打開網站</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold rounded-full flex-shrink-0">
                            2
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">往下滑，看標題</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold rounded-full flex-shrink-0">
                            3
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">點內容進去閱讀</span>
                    </div>
                </div>
            </div>

            {/* 引導下滑動畫 */}
            <div className="mt-8 flex justify-center animate-bounce text-gray-400 dark:text-gray-500">
                <ArrowDown className="w-6 h-6" />
            </div>
        </div>
    );
}
