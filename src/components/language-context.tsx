'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh-TW';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    'en': {
        // Header
        'nav.trends': 'Trends',
        'nav.archive': 'Archive',
        'nav.subscribe': 'Subscribe',

        // Homepage
        'home.title': 'Global AI Tech News',
        'home.subtitle': 'Insights into the Future of AI',
        'home.latest': 'Latest Updates',
        'home.showLatest': 'Show Latest AI Trends',
        'home.sortLatest': 'Latest',
        'home.sortPopular': 'Popular',
        'home.loadMore': 'Load More News',
        'home.loading': 'Loading...',
        'home.noMore': 'All news displayed',
        'home.readOriginal': 'Read Original',
        'home.articles': 'articles',

        // Subscribe
        'subscribe.title': 'Subscribe to Daily AI Trends Newsletter',
        'subscribe.placeholder': 'Enter your email',
        'subscribe.button': 'Subscribe',
        'subscribe.submitting': 'Subscribing...',

        // Trends
        'trends.title': 'Weekly Keyword Trends',
        'trends.subtitle': 'Top AI topics in the past 7 days',
        'trends.noData': 'Not enough data to show trends.',

        // Archive
        'archive.title': 'News Archive',
        'archive.subtitle': 'Browse all past news',

        // News Detail
        'news.backHome': 'Back to Home',
        'news.share': 'Share',
        'news.readOriginal': 'Read Original',
        'news.relatedTags': 'Related Tags',

        // Chat
        'chat.title': 'Smart Flow AI',
        'chat.subtitle': 'Here to help',
        'chat.greeting': "👋 Hello! I'm your AI reading assistant.",
        'chat.askAbout': 'Any questions about this article',
        'chat.suggestExplain': '"Explain the key points"',
        'chat.suggestImpact': '"What are the implications?"',
        'chat.placeholder': 'Type your question...',
        'chat.error': 'Sorry, an error occurred. Please try again.',
        'chat.button': 'AI Guide',

        // Footer
        'footer.rss': 'RSS Feed',
        'footer.copyright': '© 2025 Smart Flow. All rights reserved.',
        'footer.disclaimer': 'Data for reference only. Auto-aggregating global AI news.',
        'footer.poweredBy': 'Powered by Next.js, Supabase, and OpenAI.',
        'footer.builtBy': 'Built by',
        'footer.follow': 'Follow',

        // Search
        'search.placeholder': 'Search news...',
        'search.noResults': 'No results found',
    },
    'zh-TW': {
        // Header
        'nav.trends': '趨勢',
        'nav.archive': '歷史',
        'nav.subscribe': '訂閱',

        // Homepage
        'home.title': '全球 AI 科技快報',
        'home.subtitle': '洞察人工智慧的未來',
        'home.latest': '最新動態',
        'home.showLatest': '顯示最新 AI 趨勢',
        'home.sortLatest': '最新發布',
        'home.sortPopular': '熱門點擊',
        'home.loadMore': '載入更多新聞',
        'home.loading': '載入中...',
        'home.noMore': '已顯示所有新聞',
        'home.readOriginal': '閱讀原文',
        'home.articles': '則新聞',

        // Subscribe
        'subscribe.title': '訂閱每日 AI 趨勢電子報',
        'subscribe.placeholder': '輸入您的 Email',
        'subscribe.button': '訂閱',
        'subscribe.submitting': '訂閱中...',

        // Trends
        'trends.title': '每週關鍵字趨勢',
        'trends.subtitle': '過去 7 天 AI 領域最熱門的話題排行',
        'trends.noData': '目前沒有足夠的數據來顯示趨勢。',

        // Archive
        'archive.title': '新聞存檔',
        'archive.subtitle': '瀏覽所有歷史新聞',

        // News Detail
        'news.backHome': '返回首頁',
        'news.share': '分享',
        'news.readOriginal': '閱讀原文',
        'news.relatedTags': '相關標籤',

        // Chat
        'chat.title': 'Smart Flow AI',
        'chat.subtitle': '隨時為您解答',
        'chat.greeting': '👋 你好！我是您的 AI 導讀助手。',
        'chat.askAbout': '關於這篇新聞，有什麼想問的嗎？',
        'chat.suggestExplain': '"解釋這篇新聞的重點"',
        'chat.suggestImpact': '"這會有什麼影響？"',
        'chat.placeholder': '輸入您的問題...',
        'chat.error': '抱歉，發生了錯誤。請稍後再試。',
        'chat.button': 'AI 導讀',

        // Footer
        'footer.rss': 'RSS 訂閱',
        'footer.copyright': '© 2025 智流 Smart Flow. All rights reserved.',
        'footer.disclaimer': '資料來源僅供參考，本站自動彙整全球 AI 新聞。',
        'footer.poweredBy': 'Powered by Next.js, Supabase, and OpenAI.',
        'footer.builtBy': '建置者：',
        'footer.follow': '追蹤我們',

        // Search
        'search.placeholder': '搜尋新聞...',
        'search.noResults': '找不到相關結果',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('zh-TW');

    useEffect(() => {
        // Load saved language from localStorage
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'zh-TW')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
