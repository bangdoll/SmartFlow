import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findMissingSummaries() {
    // Find today's news with missing summaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, published_at')
        .gte('published_at', today.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Today\'s news items:');
    data?.forEach((item, i) => {
        const hasSummary = item.summary_zh && item.summary_zh.length > 10;
        console.log(`${i + 1}. [${hasSummary ? '✓' : '✗'}] ${item.title?.substring(0, 50)}...`);
        if (!hasSummary) {
            console.log(`   ID: ${item.id}`);
        }
    });
}

findMissingSummaries();
