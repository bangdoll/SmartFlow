
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixLastItem() {
    const id = "99b8ed8c-2a47-44f2-9b40-e90e16668f9c";
    const updates = {
        title: "前 Splunk 高管創立的 Resolve AI 在 A 輪融資中估值達 10 億美元",
        // title_en is already: "Ex-Splunk Executives' Startup Resolve AI Achieves $1 Billion Valuation with Series A Funding"
        // We can keep it or update it to match the original source title exactly if preferred. 
        // Let's keep the existing title_en or update it if it was auto-generated and differs from source.
        // The source title was "Ex-Splunk execs’ startup..."
        // Let's ensure title_en is the source title for consistency, or a good English title.
        title_en: "Ex-Splunk execs’ startup Resolve AI hits $1 billion valuation with Series A",
        summary_zh: "由前 Splunk 高管創立的 Resolve AI 獲得 3500 萬美元融資，估值達到 10 億美元。該公司致力於開發能自主解決絕大多數工單的 AI 工程師，旨在改變傳統 IT 支援模式。",
        summary_en: "Resolve AI, founded by ex-Splunk execs, raises $35M Series A at a $1B valuation to build AI that autonomously resolves IT tickets."
    };

    console.log(`Updating record ${id}...`);

    const { error } = await supabase
        .from('news_items')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Failed to update record:', error);
    } else {
        console.log(`Successfully updated record ${id}`);
    }
}

fixLastItem();
