import { supabase } from '@/lib/supabase';
import { EssentialsView } from '@/components/essentials-view';
import { NewsItem } from '@/types';

export const revalidate = 300; // 5 分鐘重新驗證

// 獲取精選新聞（按點擊數或手動標記）
async function getEssentialNews(): Promise<NewsItem[]> {
    // 獲取過去 90 天內最重要的新聞
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .gte('published_at', ninetyDaysAgo.toISOString())
        .not('summary_zh', 'is', null)
        .order('published_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Error fetching essential news:', error);
        return [];
    }

    // 按分類分組並選出代表性文章
    const categories = categorizeNews(data as NewsItem[]);
    return categories;
}

// 將新聞分類為不同主題
function categorizeNews(items: NewsItem[]): NewsItem[] {
    const categoryKeywords: Record<string, string[]> = {
        'AI 基礎入門': ['AI', '人工智慧', '基本', '入門', '概念', '什麼是'],
        'ChatGPT 與對話 AI': ['ChatGPT', 'GPT', 'Claude', 'Gemini', '對話', '聊天機器人'],
        'AI 影像生成': ['Midjourney', 'DALL-E', 'Stable Diffusion', '圖像', '影像', '生成'],
        'AI 對企業的影響': ['企業', '商業', '產業', '工作', '職場', '效率'],
        'AI 安全與倫理': ['安全', '風險', '倫理', '隱私', '偏見', '監管', '法規'],
        'AI 與程式開發': ['程式', '開發', 'Copilot', 'Cursor', '編程', '寫程式'],
        'AI 硬體與晶片': ['晶片', '硬體', 'GPU', 'NVIDIA', '輝達', '台積電'],
        'AI 最新突破': ['突破', '里程碑', '首創', '新紀錄', '重大'],
    };

    const selectedItems: NewsItem[] = [];
    const usedIds = new Set<string>();

    // 為每個分類選出 1-2 篇代表性文章
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        const matches = items.filter(item => {
            if (usedIds.has(item.id)) return false;
            const text = `${item.title} ${item.summary_zh || ''}`.toLowerCase();
            return keywords.some(kw => text.includes(kw.toLowerCase()));
        });

        // 選出最好的 2 篇（優先選有完整摘要的）
        const selected = matches
            .filter(m => m.summary_zh && m.summary_zh.length > 100)
            .slice(0, 2);

        selected.forEach(item => {
            usedIds.add(item.id);
            selectedItems.push({
                ...item,
                // 暫存分類標籤
                tags: [category, ...(item.tags || [])]
            });
        });
    });

    return selectedItems.slice(0, 15); // 最多 15 篇
}

export default async function EssentialsPage() {
    const essentialItems = await getEssentialNews();

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 pb-12">
            <EssentialsView items={essentialItems} />
        </div>
    );
}
