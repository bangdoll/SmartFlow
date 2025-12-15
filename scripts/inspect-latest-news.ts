
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Fetching latest news item...');
    const { data: latestNews, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, summary_en')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching news:', error);
        return;
    }

    console.log('Latest News ID:', latestNews.id);
    console.log('Title:', latestNews.title);
    console.log('Summary ZH Length:', latestNews.summary_zh?.length);
    console.log('Summary EN:', latestNews.summary_en); // Log explicitly
    console.log('Summary EN Length:', latestNews.summary_en?.length);
    console.log('--- Summary ZH (RAW) ---');
    console.log(JSON.stringify(latestNews.summary_zh, null, 2)); // JSON stringify to see hidden chars/newlines
    console.log('------------------------');
}

main();
