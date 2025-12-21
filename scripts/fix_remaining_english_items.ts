
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const replacements = [
    {
        pattern: 'Ex-Splunk execs',
        title_zh: '前 Splunk 高管創立的 Resolve AI 在 A 輪融資中估值達 10 億美元',
        summary_zh: '由前 Splunk 高管創立的 AI 新創公司 Resolve AI，在最新的 A 輪融資中籌集了 3500 萬美元，估值達到 10 億美元。該公司致力於建構能夠自動解決軟體問題的 AI 工程師，旨在減少系統停機時間並提升運維效率。'
    },
    {
        pattern: 'Google lobs lawsuit',
        title_zh: 'Google 起訴搜尋結果抓取公司 SerpApi',
        summary_zh: 'Google 對搜尋結果抓取服務 SerpApi 提起訴訟，指控該公司非法抓取 Google 搜尋引擎的結果並將其出售給第三方。Google 聲稱 SerpApi 的行為違反了服務條款，並試圖透過法律途徑阻止這種未經授權的數據擷取行為。'
    },
    {
        pattern: 'The evolution of expendability',
        title_zh: '可犧牲性的演化：為何某些螞蟻放棄盔甲換取數量優勢',
        summary_zh: '一項新的研究探討了螞蟻演化策略中的權衡。科學家發現，某些螞蟻物種演化出了較弱的外骨骼（放棄盔甲），轉而採取「數量取勝」的策略，透過大量的個體來保衛群體，這種「可犧牲性」的演化展示了生物適應環境的多樣性。'
    }
];

async function fixTranslation() {
    console.log('Starting manual fix for specific items (CORRECTED COLUMN MAPPING)...');

    for (const item of replacements) {
        console.log(`Looking for item matching: "${item.pattern}"`);

        // Find the item
        const { data: newsItems, error: findError } = await supabase
            .from('news_items')
            .select('*')
            .ilike('title', `%${item.pattern}%`);

        if (findError) {
            console.error(`Error finding item for "${item.pattern}":`, findError);
            continue;
        }

        if (!newsItems || newsItems.length === 0) {
            console.log(`No news item found for pattern: "${item.pattern}"`);
            continue;
        }

        // Update matches
        for (const news of newsItems) {
            console.log(`Found item: ${news.title} (${news.id})`);

            // Preserve original title as title_en if it's English (which it is, since we matched it)
            // And update 'title' to be the Chinese version.
            const updates = {
                title: item.title_zh,       // Main title becomes Chinese
                title_en: news.title,       // Move original English title to title_en
                summary_zh: item.summary_zh
            };

            console.log(`Updating translation...`);
            console.log(`New Title (ZH): ${updates.title}`);
            console.log(`New Title (EN): ${updates.title_en}`);

            const { error: updateError } = await supabase
                .from('news_items')
                .update(updates)
                .eq('id', news.id);

            if (updateError) {
                console.error(`Error updating item ${news.id}:`, updateError);
            } else {
                console.log(`Successfully updated item ${news.id}`);
            }
        }
    }

    console.log('Finished manual fix.');
}

fixTranslation().catch(console.error);
