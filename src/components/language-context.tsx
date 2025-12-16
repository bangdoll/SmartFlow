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
        'home.hot': 'Today\'s Focus',
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
        'subscribe.description': "We don't just track news; we help you avoid AI anxiety.",
        'subscribe.subDescription': 'Leave your email. Missing these 3 insights might cost you decisions 6 months later.',
        'subscribe.placeholder': 'Enter your email',
        'subscribe.button': 'Subscribe',
        'subscribe.submitting': 'Subscribing...',
        'subscribe.success': 'Subscribed! Thank you.',
        'subscribe.failed': 'Subscription failed, please try again.',

        // Header & Search
        'search.label': 'Open Search',
        'theme.light': 'Light Mode',
        'theme.dark': 'Dark Mode',
        'theme.system': 'System',

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
        'news.previous': 'Previous',
        'news.next': 'Next',
        'news.readMore': 'Read Analysis',

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
        'footer.credits': 'Jason TSAI - Digital Coach | Roam Digital',
        'footer.follow': 'Follow',

        // Search
        'search.placeholder': 'Search news...',
        'search.noResults': 'No results found',
        'search.header': 'Search Results: ',
        'search.count': 'articles found',

        // Welcome Section
        'welcome.title': 'We Decide if this AI News is Worth Your Time.',
        'welcome.subtitle1': 'Not just breaking news, but a guide to avoid AI anxiety.',
        'welcome.subtitle2': '5 minutes a day, 3 key insights you cannot miss.',
        'welcome.tip': 'If you don\'t understand AI, you are normal. This site is for people living real lives, not just engineers.',
        'welcome.step1': 'Open Site',
        'welcome.step2': 'Scan Titles',
        'welcome.step3': 'Click to Read',
        'welcome.howTo': 'How to use? Simple:',

        // Pinned Guide
        'guide.label': 'Pinned Guide',
        'guide.title': 'Newbie Guide: How to Master AI Trends Daily?',
        'guide.desc': '3 easy steps to master AI Trends Daily, including audio guides and newsletters.',

        // Guide Page Content
        'guidePage.back': 'Back to Home',
        'guidePage.badge': 'Newbie Guide',
        'guidePage.title': 'How to Master Smart Flow Daily',
        'guidePage.desc': 'Designed for busy people. No jargon, just plain tech news.',
        'guidePage.step1.title': 'Homepage: 3 Easy Steps',
        'guidePage.step1.text': 'Just follow the 1-2-3 steps in the welcome section:',
        'guidePage.step1.li1': 'Open Site: You are here!',
        'guidePage.step1.li2': 'Scroll Down: Scan the latest news cards.',
        'guidePage.step1.li3': 'Click: Read the original or the summary.',
        'guidePage.step2.title': 'Browse Latest Trends',
        'guidePage.step2.text': 'We summarize long English news into Chinese titles and short summaries. clearly marked with sources and tags.',
        'guidePage.step3.title': 'Listen & Interact (AI Guide)',
        'guidePage.step3.text': 'Click into any news to see these powerful features:',
        'guidePage.step3.audio': 'Listen to AI Guide',
        'guidePage.step3.audioDesc': 'Click play, AI reads the summary for you naturally.',
        'guidePage.step3.chat': 'AI Assistant',
        'guidePage.step3.chatDesc': 'Chat window ready. Ask "How does this affect me?"',
        'guidePage.step4.title': 'Daily Delivery (Free)',
        'guidePage.step4.text': 'Too busy? Subscribe below. We send "Today\'s Highlights" at 8 AM.',
        'guidePage.cta': 'Start Reading',

        // Daily Insight
        'insight.label': 'Daily Insight',
        'insight.sub': 'One thing you must know about AI today',
        'insight.action': 'Read Key Point',
        'insight.readMore': 'Read More',

        // News Feed
        'feed.aiGuide': 'AI Audio Guide',
    },
    'zh-TW': {
        // Header
        'nav.trends': '趨勢',
        'nav.archive': '歷史',
        'nav.subscribe': '訂閱',
        'search.label': '開啟搜尋',
        'theme.light': '淺色模式',
        'theme.dark': '深色模式',
        'theme.system': '跟隨系統',

        // Homepage
        'home.title': '全球 AI 科技快報',
        'home.subtitle': '洞察人工智慧的未來',
        'home.latest': '最新動態',
        'home.hot': '本日焦點',
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
        'subscribe.description': '我們不是幫你追新聞，是幫你避免被新聞害到。',
        'subscribe.subDescription': '留下 Email，錯過這 3 則，你可能半年後才發現自己做錯決策。',
        'subscribe.placeholder': '輸入您的 Email',
        'subscribe.button': '免費寄給我',
        'subscribe.submitting': '訂閱中...',
        'subscribe.success': '訂閱成功！感謝您的支持。',
        'subscribe.failed': '訂閱失敗，請稍後再試。',

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
        'news.previous': '上一則',
        'news.next': '下一則',
        'news.readMore': '閱讀完整分析',

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
        'footer.credits': '蔡正信-數位教練 | 漫遊數位',
        'footer.follow': '追蹤我們',

        // Search
        'search.placeholder': '搜尋新聞...',
        'search.noResults': '找不到相關結果',
        'search.header': '搜尋結果: ',
        'search.count': '找到', // Handled specially in component with dynamic string but keys help

        // Welcome Section
        'welcome.title': '我們幫你判斷：這則 AI 新聞，要不要理。',
        'welcome.subtitle1': '不是快訊，是幫你避開 AI 風險的導覽。',
        'welcome.subtitle2': '每天 5 分鐘，挑 3 則「不看會吃虧」的重點，省下你的焦慮。',
        'welcome.tip': '如果你看不懂 AI，代表你是正常人。這個網站不是寫給工程師的，是寫給還在過生活的人。',
        'welcome.step1': '打開網站',
        'welcome.step2': '往下滑，看標題',
        'welcome.step3': '點標題看原文，點內容進去閱讀',
        'welcome.howTo': '👀 怎麼用？很簡單',

        // Pinned Guide
        'guide.label': '置頂教學',
        'guide.title': '新手請進：如何使用《智流》掌握每日科技趨勢？',
        'guide.desc': '三步驟輕鬆上手，教您如何聆聽 AI 導讀與訂閱每日摘要。',

        // Guide Page
        'guidePage.back': '返回首頁',
        'guidePage.badge': '新手教學',
        'guidePage.title': '✨ 如何使用《智流》掌握每日科技趨勢',
        'guidePage.desc': '專為忙碌現代人設計。不懂 AI 術語？沒關係，這裡就是您的科技白話報紙。',
        'guidePage.step1.title': '首頁：三步驟輕鬆上手',
        'guidePage.step1.text': '一進入網站，跟著歡迎區塊的 1-2-3 步驟做就好：',
        'guidePage.step1.li1': '打開網站：您已經在這裡了！',
        'guidePage.step1.li2': '往下滑：瀏覽最新的新聞卡片。',
        'guidePage.step1.li3': '點選新聞：點標題看原文，點內容進去閱讀。',
        'guidePage.step2.title': '瀏覽最新動態',
        'guidePage.step2.text': '我們幫您把落落長的英文新聞，整理成中文標題與簡短摘要。每一張新聞卡片都會清楚標示來源與關鍵字標籤。',
        'guidePage.step3.title': '聆聽與互動 (AI 導讀)',
        'guidePage.step3.text': '點進任何一則新聞，您會看到這兩個強大功能：',
        'guidePage.step3.audio': '🎧 聆聽 AI 導讀',
        'guidePage.step3.audioDesc': '按下藍色的播放鍵，AI 會用自然的語音唸新聞摘要給您聽。',
        'guidePage.step3.chat': '💬 AI 導讀助手',
        'guidePage.step3.chatDesc': '對話視窗隨時待命。覺得新聞太難懂？直接問它。',
        'guidePage.step4.title': '每日送到家 (免費訂閱)',
        'guidePage.step4.text': '滑到首頁最下方，輸入 Email。我們每天早上 8 點準時寄送「今日重點摘要」給您。',
        'guidePage.cta': '開始閱讀新聞',

        // Daily Insight
        'insight.label': '今日智流一句話',
        'insight.sub': '今天的 AI，只做一件你該知道的事',
        'insight.action': '看今天的重點',
        'insight.readMore': '閱讀更多',

        // News Feed
        'feed.aiGuide': 'AI 導讀',
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
