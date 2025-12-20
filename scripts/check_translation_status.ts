
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkUntranslated() {
    const titles = [
        "Ex-Splunk execs' startup Resolve AI hits $1 billion valuation with Series A",
        "Google lobs lawsuit at search result scraping firm SerpApi",
        "The evolution of expendability: Why some ants traded armor for numbers"
    ];

    for (const title of titles) {
        // Use ilike for case-insensitive partial match
        const { data, error } = await supabase
            .from('news_items')
            .select('id, title, title_zh, summary_zh, created_at')
            .ilike('title', `%${title.substring(0, 20)}%`); // Match first 20 chars

        if (error) {
            console.error(`Error searching for ${title}:`, error);
        } else {
            console.log(`Results for "${title}":`);
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

checkUntranslated();
