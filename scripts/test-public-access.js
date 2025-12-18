require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testPublicAccess() {
    console.log("--- Testing Public Access (Anon Key) ---");
    // Use NEXT_PUBLIC_SUPABASE_ANON_KEY if available, otherwise try to find it or warn
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('Missing public env vars. URL:', !!url, 'Key:', !!key);
        return;
    }

    const supabase = createClient(url, key);

    // Try to select ALL columns to see what we get and if RLS blocks us
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Public Access Error (RLS?):', error);
    } else {
        console.log('Public Access Success!');
        if (data && data.length > 0) {
            console.log('Available Columns:', Object.keys(data[0]));
        } else {
            console.log('Success but returned NO data (Empty table or RLS filtering?)');
        }
    }
}

testPublicAccess();
