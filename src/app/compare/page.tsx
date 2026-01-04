import { Metadata } from 'next';
import { CompareList } from '@/components/compare-list';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
    title: 'AI 比較分析 | OpenAI vs Anthropic, ChatGPT vs Claude',
    description: '深入比較各 AI 公司和產品的最新發展、新聞報導和市場動態。了解 OpenAI、Anthropic、Google、Meta 等科技巨頭在 AI 領域的競爭與差異。',
    keywords: ['AI 比較', 'OpenAI vs Anthropic', 'ChatGPT vs Claude', 'GPT-5 vs Gemini 3', 'AI 競爭'],
};

export const revalidate = 300; // 5 分鐘重新驗證

// 熱門比較組合（含中英文描述）
const COMPARISONS = [
    { t1: 'DeepSeek', t2: 'OpenAI', desc: '新星挑戰王者', descEn: 'Rising Star vs King' },
    { t1: 'Cursor', t2: 'GitHub Copilot', desc: 'AI 寫程式神器', descEn: 'AI Coding Assistants' },
    { t1: 'OpenAI', t2: 'Anthropic', desc: 'AGI 路線之爭', descEn: 'AGI Approach Battle' },
    { t1: 'ChatGPT', t2: 'Claude', desc: '對話 AI 之巔', descEn: 'Conversational AI Champions' },
    { t1: 'Midjourney', t2: 'Flux', desc: '圖像生成王者', descEn: 'Image Gen Overlords' },
    { t1: 'Llama 3', t2: 'Mistral', desc: '開源模型對決', descEn: 'Open Source Battle' },
    { t1: 'Google', t2: 'Perplexity', desc: '搜尋引擎革命', descEn: 'Search Revolution' },
    { t1: 'Sora', t2: 'Runway', desc: '影片生成新戰場', descEn: 'Video Generation Arena' },
    { t1: 'TSMC', t2: 'NVIDIA', desc: 'AI 晶片供應鏈', descEn: 'AI Chip Supply Chain' },
    { t1: 'Apple', t2: 'Google', desc: '手機 AI 生態', descEn: 'Mobile AI Ecology' },
];

// 檢查主題是否有新聞
async function getTopicNewsCount(topic: string): Promise<number> {
    const { count, error } = await supabase
        .from('news_items')
        .select('id', { count: 'exact', head: true })
        .or(`title.ilike.%${topic}%,summary_zh.ilike.%${topic}%`)
        .limit(1);

    if (error) return 0;
    return count || 0;
}

// 過濾有資料的比較組合
async function getValidComparisons() {
    const validComparisons = [];

    for (const comp of COMPARISONS) {
        const [count1, count2] = await Promise.all([
            getTopicNewsCount(comp.t1),
            getTopicNewsCount(comp.t2),
        ]);

        // 至少一方有資料才顯示
        if (count1 > 0 || count2 > 0) {
            validComparisons.push({
                ...comp,
                count1,
                count2,
            });
        }
    }

    return validComparisons;
}

export default async function CompareIndexPage() {
    const validComparisons = await getValidComparisons();

    return <CompareList comparisons={validComparisons} />;
}
