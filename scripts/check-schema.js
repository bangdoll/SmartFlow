require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) return;

    const supabase = createClient(url, key);

    console.log('Checking schema for news_items...');

    // Select * limit 1 to get all keys
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Available Columns:', Object.keys(data[0]).sort().join(', '));
    } else {
        console.log('Table is empty, cannot infer schema from data.');
    }
}

checkSchema();
