const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

export function safeHttpUrl(value: unknown): string {
    try {
        const url = new URL(String(value));
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return escapeHtml(url.toString());
        }
    } catch {
        // Fall through to a harmless placeholder for malformed feed URLs.
    }

    return '#';
}

/**
 * Escape raw HTML before handing Markdown to marked. This keeps the useful
 * Markdown formatting while preventing feed/LLM content from injecting HTML
 * into the email body.
 */
export function escapeMarkdownForEmail(value: unknown): string {
    return escapeHtml(value);
}
