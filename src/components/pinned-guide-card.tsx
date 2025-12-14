import Link from 'next/link';
import { Pin, ArrowRight } from 'lucide-react';

export function PinnedGuideCard() {
    return (
        <div className="mb-8">
            <Link href="/guide" className="block group">
                <div className="relative bg-white dark:bg-gray-900 border-l-4 border-blue-500 rounded-r-xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Pin className="w-4 h-4 text-blue-500 fill-blue-500" />
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                置頂教學
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            新手請進：如何使用《智流》掌握每日科技趨勢？
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            三步驟輕鬆上手，教您如何聆聽 AI 導讀與訂閱每日摘要。
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
