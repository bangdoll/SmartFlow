
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FixItem {
    searchTitle: string; // The text currently in the 'title' column (which is incorrectly English)
    newTitleZh: string;
    newSummaryZh: string;
    newSummaryEn: string;
}

const itemsToFix: FixItem[] = [
    {
        searchTitle: "Ex-Splunk execs' startup Resolve AI hits $1 billion valuation with Series A",
        newTitleZh: "前 Splunk 高管創立的 Resolve AI 在 A 輪融資中估值達 10 億美元",
        newSummaryZh: "由前 Splunk 高管創立的 Resolve AI 獲得 3500 萬美元融資，估值達到 10 億美元。該公司致力於開發能自主解決絕大多數工單的 AI 工程師，旨在改變傳統 IT 支援模式。",
        newSummaryEn: "Resolve AI, founded by ex-Splunk execs, raises $35M Series A at a $1B valuation to build AI that autonomously resolves IT tickets."
    },
    {
        searchTitle: "Google lobs lawsuit at search result scraping firm SerpApi",
        newTitleZh: "Google 起訴搜尋結果抓取公司 SerpApi",
        newSummaryZh: "Google 對 SerpApi 提起訴訟，指控該公司非法抓取其搜尋結果並出售 API 存取權。Google 聲稱此舉違反了服務條款並侵害了其專有權利，尋求禁令以阻止 SerpApi 的行為。",
        newSummaryEn: "Google files a lawsuit against SerpApi, alleging the firm illegally scrapes search results and sells them, violating terms of service."
    },
    {
        searchTitle: "The evolution of expendability: Why some ants traded armor for numbers",
        newTitleZh: "可犧牲性的演化：為何某些螞蟻放棄盔甲換取數量",
        newSummaryZh: "發表於《PLOS Biology》的新研究探討了為何某些螞蟻物種在演化過程中放棄了堅硬的物理防禦（如盔甲），轉而採取「人海戰術」，演化出更龐大的群體規模與更具攻擊性的行為，展現了演化上的權衡。",
        newSummaryEn: "New research in PLOS Biology reveals why some ant species evolved to lose their armor in favor of larger colony sizes and aggressive group tactics."
    }
];

async function fixTranslations() {
    for (const item of itemsToFix) {
        console.log(`Processing: ${item.searchTitle.substring(0, 30)}...`);

        // Find the record first
        const { data: records, error: searchError } = await supabase
            .from('news_items')
            .select('*')
            .ilike('title', `%${item.searchTitle.substring(0, 20)}%`);

        if (searchError) {
            console.error('Error finding record:', searchError);
            continue;
        }

        if (!records || records.length === 0) {
            console.warn('No record found for title match.');
            continue;
        }

        const record = records[0];
        console.log(`Found record ID: ${record.id}`);

        // Update the record
        // We move the current English title to 'title_en' if it's not already set correctly
        // And set 'title' to the Chinese title
        const { error: updateError } = await supabase
            .from('news_items')
            .update({
                title: item.newTitleZh,
                title_en: item.searchTitle, // The original English title
                summary_zh: item.newSummaryZh,
                summary_en: item.newSummaryEn
            })
            .eq('id', record.id);

        if (updateError) {
            console.error('Failed to update record:', updateError);
        } else {
            console.log(`Successfully updated record ${record.id}`);
        }
    }
}

fixTranslations();
