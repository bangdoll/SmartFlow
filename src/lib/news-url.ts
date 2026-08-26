const NEWS_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFullNewsId(id: string): boolean {
    return NEWS_UUID_PATTERN.test(id);
}

/**
 * Use one public cache key for every news item. Full UUID and slug aliases
 * remain readable by the route, but public links should use the short ID.
 */
export function getCanonicalNewsId(id: string): string {
    return isFullNewsId(id) ? id.slice(0, 8) : id;
}

export function getNewsPath(id: string): string {
    return `/news/${getCanonicalNewsId(id)}`;
}
