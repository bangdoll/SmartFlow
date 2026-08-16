/**
 * Keeps user-controlled text safe when it is embedded in a PostgREST `or`
 * expression. The query API is string-based, so delimiters must not be
 * allowed to change the filter expression itself.
 */
export function normalizeSearchTerm(value: string, maxLength = 80): string {
    return value
        .normalize('NFKC')
        .replace(/[(),]/g, ' ')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

export function ilikePattern(value: string): string {
    return `%${normalizeSearchTerm(value)}%`;
}
