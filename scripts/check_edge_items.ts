import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const ids = ['dd35f276-1f9d-4ca1-a71e-78e6f1c46ae9', '5f810597-e0fe-4689-bf7d-1f7f88d9a681'];
    const { data } = await supabase.from('news_items').select('*').in('id', ids);

    data?.forEach(item => {
        console.log('\n=== ' + item.id + ' ===');
        console.log('title:', item.title);
        console.log('title_en:', item.title_en);
        console.log('summary_zh length:', item.summary_zh?.length || 0);
        console.log('summary_en length:', item.summary_en?.length || 0);

        // Analyze
        const chineseChars = item.title?.match(/[\u4e00-\u9fff]/g)?.length || 0;
        const englishChars = item.title?.match(/[a-zA-Z]/g)?.length || 0;
        console.log(`Chinese chars: ${chineseChars}, English chars: ${englishChars}`);
    });
}

check();
