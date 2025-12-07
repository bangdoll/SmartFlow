export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-12 transition-colors">
            <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">
                    &copy; {new Date().getFullYear()} 智流 Smart Flow. All rights reserved.
                </p>
                <p className="text-sm">
                    資料來源僅供參考，本站自動彙整全球 AI 新聞。
                    <br />
                    Powered by Next.js, Supabase, and OpenAI.
                </p>
            </div>
        </footer>
    );
}
