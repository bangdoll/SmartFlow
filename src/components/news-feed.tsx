import { NewsItem } from '@/types';
import { NewsCard } from './news-card';

interface NewsFeedProps {
    items: NewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
    if (!items || items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                目前沒有新聞摘要。
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <NewsCard key={item.id || item.original_url} news={item} />
            ))}
        </div>
    );
}
