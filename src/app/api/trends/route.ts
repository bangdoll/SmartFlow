import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: items, error } = await supabase
            .from('news_items')
            .select('tags')
            .gte('published_at', sevenDaysAgo.toISOString());

        if (error) throw error;

        // Flatten tags and count frequency
        const tagCounts: Record<string, number> = {};
        items?.forEach(item => {
            const tags = item.tags as string[] | null;
            tags?.forEach((tag: string) => {
                const normalizedTag = tag.trim();
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            });
        });

        // Convert to array and sort
        const sortedTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        return NextResponse.json(sortedTags);
    } catch (error) {
        console.error('Error fetching trends:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
