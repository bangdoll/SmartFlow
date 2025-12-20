
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findMissingItem() {
    const searchTerm = "Resolve AI"; // Using a distinct substring
    console.log(`Searching for items containing: "${searchTerm}"...`);

    const { data, error } = await supabase
        .from('news_items')
        .select('id, title, title_en')
        .ilike('title', `%${searchTerm}%`);

    if (error) {
        console.error('Error searching:', error);
    } else {
        console.log('Found records:');
        console.log(JSON.stringify(data, null, 2));
    }
}

findMissingItem();
