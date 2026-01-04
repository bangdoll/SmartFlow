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
    { t1: 'Apple', t2: 'Google', desc: '手機 AI 生態與系統對決', descEn: 'Mobile AI Ecosystems' },
    { t1: 'OpenAI', t2: 'Google', desc: 'AI 霸主爭奪戰', descEn: 'Battle for AI Supremacy' },
    { t1: 'Innovation', t2: 'Ethics', desc: '發展速度與安全倫理的拉鋸', descEn: 'Speed vs Safety' },
    { t1: 'GPT-5.2', t2: 'Gemini 3', desc: '2026 通用模型巔峰對決', descEn: 'Peak of General Models' },
    { t1: 'Security', t2: 'Privacy', desc: '數據保護的永恆難題', descEn: 'Data Protection Paradox' },
    { t1: 'ChatGPT', t2: 'Apple', desc: '雲端 AI 與 邊緣 AI 的融合', descEn: 'Cloud vs Edge AI' },
    { t1: 'TSMC', t2: 'NVIDIA', desc: 'AI 晶片供應鏈', descEn: 'AI Chip Supply Chain' },
    { t1: 'DeepSeek V3', t2: 'OpenAI o3', desc: '高性價比推理對決', descEn: 'High Value Reasoning' },
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
