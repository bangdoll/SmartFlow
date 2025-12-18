require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Testing connection to:', url);

    // Test querying with localized columns
    const { data, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, summary_en, title_en, slug, published_at')
        .order('published_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Success! Retrieved item.');
        console.log('Keys:', Object.keys(data[0]));
    }
}

testConnection();
