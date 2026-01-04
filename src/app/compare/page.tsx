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
    { t1: 'GPT-5.2', t2: 'Gemini 3', desc: '通用模型巔峰對決', descEn: 'Peak of General Models' },
    { t1: 'Claude 4.5', t2: 'GPT-5.2', desc: '推理與代理終極較量', descEn: 'Ultimate Reasoning Battle' },
    { t1: 'Midjourney v7', t2: 'Flux 2', desc: '圖像生成的藝術與真實', descEn: 'Art vs Realism' },
    { t1: 'Cursor', t2: 'Claude Code 2.0', desc: 'IDE vs Agent', descEn: 'IDE vs Agent' },
    { t1: 'Sora 2', t2: 'Runway Gen-4', desc: '影片生成新紀元', descEn: 'New Era of Video Gen' },
    { t1: 'Grok 3', t2: 'Llama 4', desc: '開源與自由模型領先者', descEn: 'Open/Free Model Leaders' },
    { t1: 'DeepSeek V3', t2: 'OpenAI o3', desc: '高性價比推理對決', descEn: 'High Value Reasoning' },
    { t1: 'Apple', t2: 'Google', desc: '手機 AI 生態', descEn: 'Mobile AI Ecology' },
    { t1: 'TSMC', t2: 'NVIDIA', desc: 'AI 晶片供應鏈', descEn: 'AI Chip Supply Chain' },
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
