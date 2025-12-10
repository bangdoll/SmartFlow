export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-12 transition-colors">
            <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex justify-center gap-4 mb-4">
                    <a
                        href="/feed.xml"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4.82 17.82a2.18 2.18 0 0 1 1.36-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
                        </svg>
                        RSS 訂閱
                    </a>
                </div>
                <p className="mb-4">
                    &copy; {new Date().getFullYear()} 智流 Smart Flow. All rights reserved.
                </p>
                <p className="text-sm">
                    資料來源僅供參考，本站自動彙整全球 AI 新聞。
                    <br />
                    Powered by Next.js, Supabase, and OpenAI.
                </p>
                <p className="text-sm mt-4 text-gray-400 dark:text-gray-500">
                    建置者：蔡正信-數位教練 | 漫遊數位 <a href="https://rd.coach" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://rd.coach</a>
                </p>
            </div>
        </footer>
    );
}
