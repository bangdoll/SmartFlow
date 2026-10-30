/**
 * Keeps user-controlled text safe when it is embedded in a PostgREST `or`
 * expression. The query API is string-based, so delimiters must not be
 * allowed to change the filter expression itself.
 */
export function normalizeSearchTerm(value: string | string[] | undefined, maxLength = 80): string {
    const term = Array.isArray(value) ? value[0] || '' : value || '';
    return term
        .normalize('NFKC')
        .replace(/[(),]/g, ' ')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

export function ilikePattern(value: string): string {
    const escaped = normalizeSearchTerm(value).replace(/[\\%_]/g, character => `\\${character}`);
    return `%${escaped}%`;
}
