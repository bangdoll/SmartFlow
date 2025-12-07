export interface NewsItem {
    id?: string;
    original_url: string;
    title: string;
    source: string;
    published_at: string; // ISO string
    summary_en?: string;
    summary_zh?: string;
    tags?: string[];
    created_at?: string;
}

export interface Subscriber {
    id: string;
    email: string;
    subscribed_at: string;
    is_active: boolean;
}

export type ScrapedNews = Pick<NewsItem, 'original_url' | 'title' | 'source' | 'published_at'> & {
    content?: string; // 暫存原始內容用於摘要
};
