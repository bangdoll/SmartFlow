import { revalidatePath, revalidateTag } from 'next/cache';
import { ALL_NEWS_ALIASES_TAG, newsAliasTag } from '@/lib/news-alias-tag';
import { getCanonicalNewsId, getNewsPath } from '@/lib/news-url';
import { supabaseAdmin as supabase } from '@/lib/supabase';

/** Call only after the database confirms a successful write. */
export function invalidateNewsItem(id: string, slug?: string | null) {
    revalidatePath(getNewsPath(id));
    if (slug && slug !== getCanonicalNewsId(id)) {
        revalidatePath(`/news/${encodeURIComponent(slug)}`);
        revalidateTag(newsAliasTag(slug), { expire: 0 });
    }
}

/** A new article also changes the navigation on its two immediate neighbours. */
export async function invalidateInsertedNews(item: { id: string; slug?: string | null; published_at?: string | null }) {
    invalidateNewsItem(item.id, item.slug);
    if (!item.published_at) return;

    // Bound maintenance overhead; a failed neighbour lookup falls back to the
    // ten-minute ISR interval, without turning a committed insert into a retry.
    try {
        const results = await Promise.all([
            supabase.from('news_items').select('id')
                .lt('published_at', item.published_at).order('published_at', { ascending: false })
                .limit(1).abortSignal(AbortSignal.timeout(3000)).maybeSingle(),
            supabase.from('news_items').select('id')
                .gt('published_at', item.published_at).order('published_at', { ascending: true })
                .limit(1).abortSignal(AbortSignal.timeout(3000)).maybeSingle(),
        ]);
        for (const result of results) {
            if (result.error) console.error('Unable to invalidate adjacent news:', result.error.message);
            else if (result.data) invalidateNewsItem(result.data.id);
        }
    } catch (error) {
        console.error('Unable to invalidate adjacent news:', error);
    }
}

/** Reserved for the authenticated operation that actually deletes all news. */
export function invalidateAllNews() {
    revalidatePath('/news/[id]', 'page');
    revalidateTag(ALL_NEWS_ALIASES_TAG, { expire: 0 });
}
