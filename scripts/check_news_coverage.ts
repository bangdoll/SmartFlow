
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NEW_TOPICS = [
    'GPT-5.2', 'Gemini 3', 'Claude 4.5', 'Midjourney v7', 'Flux 2', 'Cursor', 'Claude Code 2.0', 'Sora 2', 'Runway Gen-4', 'Grok 3', 'Llama 4'
];

async function checkTopics() {
    console.log('Checking news counts for new topics...');
    for (const topic of NEW_TOPICS) {
        const { count, error } = await supabase
            .from('news_items')
            .select('id', { count: 'exact', head: true })
            .or(`title.ilike.%${topic}%,summary_zh.ilike.%${topic}%`);

        console.log(`${topic}: ${count || 0}`);
    }

    console.log('\n--- Top Tags Analysis ---');
    // Fetch last 1000 items to analyze tags
    const { data: news } = await supabase
        .from('news_items')
        .select('tags')
        .order('published_at', { ascending: false })
        .limit(1000);

    if (news) {
        const tagCounts: Record<string, number> = {};
        news.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30);

        console.log('Top 30 Tags:', sortedTags.map(([t, c]) => `${t} (${c})`).join(', '));
    }
}

checkTopics();
