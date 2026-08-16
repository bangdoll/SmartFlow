import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/site';

// Initialize Supabase client for sitemap generation
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = SITE_URL;

    // Fetch latest news for sitemap
    const { data: news } = await supabase
        .from('news_items')
        .select('id, published_at, created_at, tags')
        .order('published_at', { ascending: false })
        .limit(100);

    const newsUrls = (news || []).map((item) => ({
        url: `${baseUrl}/news/${item.id}`,
        lastModified: new Date(item.published_at || item.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Extract unique tags
    const tags = new Set<string>();
    (news || []).forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => tags.add(tag));
        }
    });

    const tagUrls = Array.from(tags).map(tag => ({
        url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/trends`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/archive`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        ...newsUrls,
        ...tagUrls,
    ];
}
