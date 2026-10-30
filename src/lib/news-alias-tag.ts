import { createHash } from 'node:crypto';

export const ALL_NEWS_ALIASES_TAG = 'news-aliases';
export function newsAliasTag(slug: string) {
    return `news-alias:${createHash('sha256').update(slug).digest('hex')}`;
}
