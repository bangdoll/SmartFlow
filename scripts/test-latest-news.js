require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testLatestNews() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Testing getLatestNews query (without click_count)...');

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, original_url, summary_zh, summary_en, title_en, slug, published_at, source, tags, created_at')
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Query Failed:', error);
    } else {
        console.log(`Success! Retrieved ${items?.length || 0} items.`);
        if (items && items.length > 0) {
            console.log('Sample Item:', JSON.stringify(items[0], null, 2));
        }
    }
}

testLatestNews();
