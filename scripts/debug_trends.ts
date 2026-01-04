
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWeeklyTrends() {
    const { data, error } = await supabase
        .from('weekly_trends')
        .select('trends, week_start_date')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Week Start Date:', data.week_start_date);
    console.log('Trends Data:', JSON.stringify(data.trends, null, 2));
}

checkWeeklyTrends();
