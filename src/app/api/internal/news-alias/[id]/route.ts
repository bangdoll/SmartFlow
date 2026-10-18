import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getNewsPath, isFullNewsId } from '@/lib/news-url';
import { ALL_NEWS_ALIASES_TAG, newsAliasTag } from '@/lib/news-alias-tag';

// Separating alias redirects from ISR avoids duplicate Location headers in
// Next 16.0.7. This handler is public, read-only, and cannot redirect off-site.
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let canonicalId: string | null = isFullNewsId(id) ? id : null;
    if (!canonicalId && isSupabaseConfigured()) {
        canonicalId = await unstable_cache(async () => {
            const { data, error } = await supabase.from('news_items').select('id').eq('slug', id).maybeSingle();
            if (error) throw new Error('Unable to resolve news alias', { cause: error });
            return data?.id ?? null;
        }, ['news-alias-v1', id], { revalidate: 600, tags: [ALL_NEWS_ALIASES_TAG, newsAliasTag(id)] })();
    }
    const headers = { 'Cache-Control': 'private, no-store' };
    return canonicalId
        ? new Response(null, { status: 308, headers: { ...headers, Location: getNewsPath(canonicalId) } })
        : new Response('News Not Found', { status: 404, headers });
}
