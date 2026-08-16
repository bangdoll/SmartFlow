/**
 * JSON-LD is placed inside a script tag. Escaping these characters prevents
 * user- or feed-controlled text from prematurely closing that script tag.
 */
export function serializeJsonLd(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
